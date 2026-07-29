#!/usr/bin/env python3
"""
MCP PDC Proxy - STDIO JSON-RPC Proxy with PDC Authentication

STDIO-based proxy for MCP clients (Claude CLI, Q Developer CLI) to connect to
OpenEdge MCP Service with automatic PDC authentication, token refresh, and API Key validation.

Usage:
    # Step 1: Login once (creates ~/.oemcp/config-pdc-cli.json)
    python mcp-login.py

    # Step 2: Configure MCP client (NO API KEY NEEDED!)
    {
      "mcpServers": {
        "openedge-abl": {
          "command": "python3",
          "args": ["/path/to/mcp-proxy.py"]
        }
      }
    }

    # Optional: Override with environment variable
    export OE_ABL_MCP_API_KEY="your-api-key-here"
    python mcp-proxy.py

Features:
- Automatic token refresh (every 50 minutes)
- Token validation (every 30 seconds)
- SSE (Server-Sent Events) support for streaming responses
- Thread-safe token and validation management
- Graceful error handling with JSON-RPC compliance
- Zero external dependencies (stdlib only)

Security:
- Tokens expire after 55 minutes (refresh at 50 min)
- Token validated every 30 seconds (detects revoked API Keys)
- Revoked API Keys detected within 30 seconds
- Automatic re-authentication on token expiry
"""

import json
import os
import sys
import threading
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from datetime import datetime, timedelta

# === Configuration ===
PDC_BASE_URL = 'https://openedge.data.progress.cloud'

# PDC API Endpoints
PDC_TOKEN_URL = f'{PDC_BASE_URL}/token'
PDC_VALIDATE_URL = f'{PDC_BASE_URL}/api/account/apikey'
MCP_SERVER_URL = f'{PDC_BASE_URL}/openedgemcp/connector4abl/mcp'

# Timing configuration
TOKEN_REFRESH_INTERVAL = 50 * 60  # 50 minutes (refresh before 55-min expiry)
VALIDATION_INTERVAL = 40          # 40 seconds (validate token, detect revoked keys)

# === Global State ===
current_token = None
token_lock = threading.Lock()
mcp_session_id = None
api_key_revoked = False
validation_lock = threading.Lock()

def log_info(message: str):
    """Write informational message to stderr"""
    print(f"[PROXY INFO] {message}", file=sys.stderr)

def log_warning(message: str):
    """Write warning message to stderr"""
    print(f"[PROXY WARNING] {message}", file=sys.stderr)

def log_error(message: str):
    """Write error message to stderr"""
    print(f"[PROXY ERROR] {message}", file=sys.stderr)

def get_config_file_path() -> Path:
    """Get path to CLI-specific config file"""
    return Path.home() / '.oemcp' / 'config-pdc-cli.json'

def check_config_status() -> tuple:
    """Check if config file exists and has required data
    
    Returns:
        tuple: (is_valid, error_message, config_data)
    """
    config_file = get_config_file_path()
    
    # Check if config file exists
    if not config_file.exists():
        return False, "config_not_found", None
    
    # Try to load config
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
    except json.JSONDecodeError:
        return False, "config_corrupted", None
    except Exception as e:
        return False, f"config_read_error: {str(e)}", None
    
    # Check if API Key exists
    if not config.get('api_key'):
        return False, "api_key_missing", config
    
    # Check API Key format
    api_key = config['api_key'].strip()
    if len(api_key) < 20:
        return False, "api_key_invalid_format", config
    
    # All checks passed
    return True, "", config

def load_config() -> dict:
    """Load config from ~/.oemcp/config-pdc-cli.json"""
    config_file = get_config_file_path()
    
    if config_file.exists():
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            log_error(f"Failed to load config: {e}")
            return None
    
    return None

def update_config(updates: dict):
    """Update config file with new values (e.g., refreshed token)"""
    config_file = get_config_file_path()
    
    # Load existing config
    config = load_config() or {}
    
    # Update with new values
    config.update(updates)
    
    # Write back to file
    try:
        config_file.parent.mkdir(parents=True, exist_ok=True)
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        os.chmod(config_file, 0o600)
    except Exception as e:
        log_error(f"Failed to update config: {e}")

def get_api_key() -> tuple:
    """Get API Key from config file or ENV (ENV is override)
    
    Returns:
        tuple: (api_key, error_type) - error_type is empty string if successful
    """
    # Check config file status first
    is_valid, error_type, config = check_config_status()
    
    if is_valid and config:
        api_key = config['api_key']
        log_info(f"API Key loaded from config file")
        return api_key, ""
    
    # Allow ENV as override (for testing/flexibility)
    api_key = os.environ.get('OE_ABL_MCP_API_KEY')
    if api_key:
        log_info(f"API Key loaded from environment variable (override)")
        return api_key, ""
    
    # No API Key found - return error type
    return None, error_type

def fetch_token(api_key: str) -> str:
    """Fetch new access token from PDC and save to config file"""
    try:
        # PDC expects 'key' + 'grantType' format
        data = json.dumps({
            'key': api_key.strip(),
            'grantType': 'apikey'
        }).encode('utf-8')
        
        request = Request(
            PDC_TOKEN_URL,
            data=data,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'MCP-PDC-Proxy/1.0.0'
            },
            method='POST'
        )
        
        with urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            # Check for error responses
            if result.get('statusCode') == 401:
                raise Exception('Invalid or expired API Key')
            
            if result.get('statusCode') == 400:
                raise Exception('Bad request: Invalid API Key format')
            
            if result.get('statusCode') and result['statusCode'] != 200:
                error_msg = result.get('errorMessage', 'Authentication failed')
                raise Exception(f"PDC error: {error_msg}")
            
            # PDC returns 'access_token' field, not 'token'
            token = result.get('access_token')
            
            if not token:
                raise Exception('No access token in response')
            
            # Save updated token to config file
            expiry_time = datetime.now() + timedelta(seconds=TOKEN_REFRESH_INTERVAL + 5 * 60)
            update_config({
                'token': token,
                'token_expiry': expiry_time.isoformat(),
                'last_refresh': datetime.now().isoformat()
            })
            
            log_info(f"Token fetched and saved to config (expires in 55 minutes)")
            return token
            
    except HTTPError as e:
        if e.code == 401:
            raise Exception('Invalid or expired API Key')
        raise Exception(f'HTTP {e.code}')
    except Exception as e:
        raise Exception(f'Token fetch failed: {str(e)}')

def validate_api_key_with_token(access_token: str) -> bool:
    """Validate if the API Key (that generated the token) is still active
    
    Args:
        access_token: The current access token (NOT the API Key!)
        
    Returns:
        True if API Key is still valid, False if revoked
    """
    try:
        request = Request(
            PDC_VALIDATE_URL,
            headers={'Authorization': f'Bearer {access_token}'},  # Use ACCESS TOKEN!
            method='GET'
        )
        
        with urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            # PDC returns: {"apikey": "...", "expiryDate": "..."}
            # If response has 'apikey' field, the API Key is valid
            if 'apikey' in result:
                expiry_date = result.get('expiryDate', 'Unknown')
                log_info(f"API Key validation: VALID (expires: {expiry_date})")
                return True
            else:
                log_warning("API Key validation: INVALID (no apikey in response)")
                return False
            
    except HTTPError as e:
        if e.code == 401:
            log_warning("API Key validation: INVALID (401 Unauthorized)")
            return False
        log_error(f"API Key validation failed: HTTP {e.code}")
        return False
    except Exception as e:
        log_error(f"API Key validation error: {str(e)}")
        return False

def refresh_token_worker(api_key: str):
    """Background thread to refresh token every 50 minutes"""
    global current_token
    
    while True:
        time.sleep(TOKEN_REFRESH_INTERVAL)
        
        try:
            log_info("Refreshing token (50-minute interval)...")
            new_token = fetch_token(api_key)
            
            with token_lock:
                current_token = new_token
            
            log_info("Token refreshed successfully")
            
        except Exception as e:
            log_error(f"Token refresh failed: {e}")
            # Don't exit - keep trying (maybe network issue)

def validate_api_key_worker(api_key: str):
    """Background thread to validate API Key is still active every 30 seconds"""
    global api_key_revoked, current_token
    
    while True:
        time.sleep(VALIDATION_INTERVAL)
        
        try:
            # Get current access token (thread-safe)
            with token_lock:
                token = current_token
            
            if not token:
                log_warning("No token available for validation")
                continue
            
            # Validate the API Key using the access token
            # The validation endpoint checks if the API Key (that generated the token) is still active
            is_valid = validate_api_key_with_token(token)
            
            with validation_lock:
                if not is_valid:
                    # API Key is revoked - try to fetch a new token to confirm
                    log_warning("API Key appears revoked - attempting to fetch new token...")
                    try:
                        new_token = fetch_token(api_key)
                        with token_lock:
                            current_token = new_token
                        log_info("New token fetched successfully (false alarm - API Key is valid)")
                    except Exception as e:
                        # Confirmed: API Key is revoked
                        api_key_revoked = True
                        log_error("="*80)
                        log_error("API KEY INVALID OR REVOKED")
                        log_error("="*80)
                        log_error("Cannot fetch new token. Your API Key is no longer valid.")
                        log_error("This could mean:")
                        log_error("  1. API Key was revoked in PDC dashboard")
                        log_error("  2. API Key expired")
                        log_error("  3. Account access was disabled")
                        log_error("")
                        log_error(f"Error details: {str(e)}")
                        log_error("")
                        log_error("TO FIX: Run the login script with a valid API Key:")
                        log_error("  python mcp-login.py")
                        log_error("="*80)
                        # Exit immediately - force user to re-login
                        os._exit(1)
                    
        except Exception as e:
            log_error(f"API Key validation worker error: {e}")
            # Don't exit on unexpected errors (network issues, etc.)

def forward_request(request_data: dict) -> dict:
    """Forward JSON-RPC request to OpenEdge MCP Service"""
    global mcp_session_id, current_token, api_key_revoked
    
    # Check if API Key was revoked
    with validation_lock:
        if api_key_revoked:
            return {
                'jsonrpc': '2.0',
                'id': request_data.get('id'),
                'error': {
                    'code': -32603,
                    'message': 'API Key has been revoked or deactivated. Please run mcp-login.py to re-authenticate.'
                }
            }
    
    # Get current token (thread-safe)
    with token_lock:
        token = current_token
    
    if not token:
        return {
            'jsonrpc': '2.0',
            'id': request_data.get('id'),
            'error': {
                'code': -32603,
                'message': 'Authentication failed: No token available'
            }
        }
    
    try:
        data = json.dumps(request_data).encode('utf-8')
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': f'Bearer {token}'
        }
        
        # Include Mcp-Session-Id header if we have one
        if mcp_session_id:
            headers['Mcp-Session-Id'] = mcp_session_id
        
        request = Request(
            MCP_SERVER_URL,
            data=data,
            headers=headers,
            method='POST'
        )
        
        with urlopen(request, timeout=30) as response:
            content_type = response.headers.get('Content-Type', '')
            
            # Capture Mcp-Session-Id from response (if present)
            session_id = response.headers.get('Mcp-Session-Id')
            if session_id:
                mcp_session_id = session_id
            
            # Handle Server-Sent Events (SSE) for streaming responses
            if 'text/event-stream' in content_type:
                log_info(f"Received SSE response for {request_data.get('method')}")
                
                result = None
                for line in response:
                    line = line.decode('utf-8').strip()
                    
                    if line.startswith('data: '):
                        data_str = line[6:]  # Remove 'data: ' prefix
                        try:
                            result = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue
                
                return result if result else {
                    'jsonrpc': '2.0',
                    'id': request_data.get('id'),
                    'error': {
                        'code': -32603,
                        'message': 'No valid SSE data received'
                    }
                }
            
            # Regular JSON response
            else:
                response_text = response.read().decode('utf-8')
                
                # Handle HTTP 202 (Accepted) for notifications
                if response.status == 202:
                    return None  # Don't send response for notifications
                
                return json.loads(response_text)
                
    except HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            error_data = json.loads(error_body)
            error_msg = error_data.get('error', {}).get('message', str(e))
        except:
            error_msg = f'HTTP {e.code}'
        
        if e.code == 401:
            return {
                'jsonrpc': '2.0',
                'id': request_data.get('id'),
                'error': {
                    'code': -32603,
                    'message': 'Authentication failed: Invalid or expired token'
                }
            }
        else:
            return {
                'jsonrpc': '2.0',
                'id': request_data.get('id'),
                'error': {
                    'code': -32603,
                    'message': f'MCP server error: {error_msg}'
                }
            }
            
    except URLError as e:
        return {
            'jsonrpc': '2.0',
            'id': request_data.get('id'),
            'error': {
                'code': -32603,
                'message': f'Connection error: {e.reason}'
            }
        }
    except Exception as e:
        return {
            'jsonrpc': '2.0',
            'id': request_data.get('id'),
            'error': {
                'code': -32603,
                'message': f'Request failed: {str(e)}'
            }
        }

def start_mcp_proxy():
    """Main STDIO loop - read JSON-RPC from stdin, forward to MCP server, write response to stdout"""
    log_info("OpenEdge MCP PDC Proxy started")
    log_info(f"MCP Server: {MCP_SERVER_URL}")
    log_info(f"Token refresh: Every {TOKEN_REFRESH_INTERVAL // 60} minutes")
    log_info(f"Token validation: Every {VALIDATION_INTERVAL} seconds")
    
    buffer = ""
    
    while True:
        try:
            line = sys.stdin.readline()
            
            if not line:
                # EOF reached - client closed connection
                log_info("EOF received, exiting")
                break
            
            buffer += line
            
            # Try to parse complete JSON message
            try:
                request = json.loads(buffer)
                buffer = ""  # Clear buffer on successful parse
                
                log_info(f"Received request: {request.get('method')} (id={request.get('id')})")
                
                # Forward request to MCP server
                response = forward_request(request)
                
                # Send response back to client (if not notification)
                if response:
                    sys.stdout.write(json.dumps(response) + '\n')
                    sys.stdout.flush()
                    log_info(f"Sent response for id={response.get('id')}")
                
            except json.JSONDecodeError:
                # Incomplete JSON, keep buffering
                continue
                
        except KeyboardInterrupt:
            log_error("Interrupted by user")
            break
        except Exception as e:
            log_error(f"Unexpected error: {e}")
            
            # Send error response if we have a request ID
            try:
                error_response = {
                    'jsonrpc': '2.0',
                    'id': None,
                    'error': {
                        'code': -32603,
                        'message': f'Internal error: {str(e)}'
                    }
                }
                sys.stdout.write(json.dumps(error_response) + '\n')
                sys.stdout.flush()
            except:
                pass

def main():
    global current_token
    
    try:
        # Get API Key
        api_key, error_type = get_api_key()
        
        if not api_key:
            log_error("="*80)
            log_error("CONFIGURATION ERROR")
            log_error("="*80)
            
            config_file = get_config_file_path()
            
            if error_type == "config_not_found":
                log_error("Configuration file not found.")
                log_error("")
                log_error("This means you haven't run the login script yet.")
                log_error("")
                log_error("REQUIRED: Run the login script to authenticate:")
                log_error("  python mcp-login.py")
                log_error("")
                log_error("The login script will:")
                log_error("  1. Prompt for your PDC API Key")
                log_error("  2. Validate the API Key with PDC")
                log_error("  3. Fetch initial access token")
                log_error(f"  4. Save credentials to: {config_file}")
                log_error("")
                log_error("After successful login, restart your MCP client.")
                log_error("")
                log_error("Note: Make sure your mcp.json has the correct path to mcp-proxy.py")
            
            elif error_type == "config_corrupted":
                log_error("Configuration file is corrupted or contains invalid JSON.")
                log_error("")
                log_error(f"Config file location: {config_file}")
                log_error("")
                log_error("TO FIX:")
                log_error("  1. Delete or backup the corrupted config file")
                log_error("  2. Run the login script again: python mcp-login.py")
                log_error("")
                log_error("This will create a fresh configuration file.")
            
            elif error_type == "api_key_missing":
                log_error("Configuration file exists but API Key is missing.")
                log_error("")
                log_error(f"Config file location: {config_file}")
                log_error("")
                log_error("The config file may have been manually edited or corrupted.")
                log_error("")
                log_error("TO FIX: Re-run the login script:")
                log_error("  python mcp-login.py")
                log_error("")
                log_error("This will update the config file with valid credentials.")
            
            elif error_type == "api_key_invalid_format":
                log_error("API Key in config file has invalid format.")
                log_error("")
                log_error(f"Config file location: {config_file}")
                log_error("")
                log_error("API Key must be at least 20 characters long.")
                log_error("")
                log_error("TO FIX: Re-run the login script with a valid API Key:")
                log_error("  python mcp-login.py")
            
            elif error_type.startswith("config_read_error"):
                log_error("Cannot read configuration file.")
                log_error("")
                log_error(f"Error: {error_type.split(': ', 1)[-1]}")
                log_error(f"Config file location: {config_file}")
                log_error("")
                log_error("TO FIX: Check file permissions or re-run the login script:")
                log_error("  python mcp-login.py")
            
            else:
                log_error("No API Key found in config file or environment variable.")
                log_error("")
                log_error("REQUIRED: Run the login script to authenticate:")
                log_error("  python mcp-login.py")
                log_error("")
                log_error(f"Expected config file location: {config_file}")
                log_error("")
                log_error("Make sure your mcp.json has the correct path to mcp-proxy.py")
            
            log_error("="*80)
            sys.exit(1)
        
        log_info(f"API Key found (length={len(api_key)})")
        
        # Try to read existing token from config file
        config_file = get_config_file_path()
        existing_token = None
        token_expiry = None
        
        try:
            if config_file.exists():
                with open(config_file, 'r') as f:
                    config = json.load(f)
                    existing_token = config.get('token')
                    token_expiry_str = config.get('token_expiry')
                    
                    if token_expiry_str:
                        try:
                            token_expiry = datetime.fromisoformat(token_expiry_str)
                        except:
                            pass
        except Exception as e:
            log_warning(f"Could not read existing token: {e}")
        
        # Check if existing token is still valid
        if existing_token and token_expiry:
            # Add 1 minute buffer to avoid race conditions
            if datetime.now() < (token_expiry - timedelta(minutes=1)):
                minutes_remaining = int((token_expiry - datetime.now()).total_seconds() / 60)
                log_info(f"Using existing token (expires in {minutes_remaining} minutes)")
                current_token = existing_token
            else:
                log_info("Existing token expired - fetching new token...")
                current_token = fetch_token(api_key)
        else:
            log_info("No valid token in config - fetching new token...")
            current_token = fetch_token(api_key)
        
        if not current_token:
            log_error("ERROR: Failed to get token")
            sys.exit(1)
        
        log_info("Token ready")
        
        # Start background workers
        refresh_thread = threading.Thread(
            target=refresh_token_worker,
            args=(api_key,),
            daemon=True
        )
        refresh_thread.start()
        log_info("Token refresh worker started")
        
        validation_thread = threading.Thread(
            target=validate_api_key_worker,
            args=(api_key,),
            daemon=True
        )
        validation_thread.start()
        log_info("Token validation worker started")
        
        # Start STDIO proxy loop
        start_mcp_proxy()
        
    except Exception as e:
        log_error(f"FATAL ERROR: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
