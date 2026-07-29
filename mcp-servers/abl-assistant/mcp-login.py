#!/usr/bin/env python3
"""
MCP Login CLI Tool - PDC Authentication

Standalone script for CLI users to authenticate with Progress Data Cloud (PDC)
and get credentials for use with Claude CLI, Q Developer CLI, or other MCP-compatible tools.

Creates CLI-specific config file: ~/.oemcp/config-pdc-cli.json
(Each tool has its own config file for simplicity)

Usage:
    python mcp-login.py
    python mcp-login.py --api-key <your-api-key>
    python mcp-login.py --reset
"""

import argparse
import json
import os
import sys
import getpass
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from datetime import datetime, timedelta

# PDC endpoints
PDC_BASE_URL = 'https://openedge.data.progress.cloud'
PDC_TOKEN_URL = f'{PDC_BASE_URL}/token'
PDC_VALIDATE_URL = f'{PDC_BASE_URL}/api/account/apikey'
TOKEN_EXPIRY_SECONDS = 55 * 60  # 55 minutes

def validate_api_key(api_key: str) -> bool:
    """Validate API Key format"""
    if not api_key or len(api_key) < 20:
        return False
    return True

def authenticate_pdc(api_key: str) -> dict:
    """Authenticate with PDC using API Key"""
    print(f"\n🔐 Authenticating with Progress Data Cloud...")
    
    if not validate_api_key(api_key):
        raise Exception('API Key must be at least 20 characters long')
    
    try:
        # Authenticate with PDC (key + grantType format required by PDC)
        data = json.dumps({
            'key': api_key.strip(),
            'grantType': 'apikey'
        }).encode('utf-8')
        
        request = Request(
            PDC_TOKEN_URL,
            data=data,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'MCP-Login-PDC/1.0.0'
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
            if not result.get('access_token'):
                raise Exception('No access token received from PDC')
            
            # Default expiry: 55 minutes (PDC returns expires_in in MINUTES)
            expires_in = result.get('expires_in', 55)
            user_name = result.get('userName', 'Unknown')
            
            return {
                'token': result['access_token'],
                'expiresIn': expires_in,
                'userName': user_name
            }
            
    except HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            error_data = json.loads(error_body)
            error_msg = error_data.get('error', str(e))
        except:
            error_msg = f'HTTP {e.code}'
        
        if e.code == 401:
            raise Exception('Authentication failed: Invalid API Key')
        else:
            raise Exception(f'Authentication failed: {error_msg}')
            
    except URLError as e:
        raise Exception(f'Connection failed: {e.reason}')
    except Exception as e:
        if 'API Key' in str(e) or 'Authentication' in str(e):
            raise
        raise Exception(f'Authentication failed: {str(e)}')

def validate_token_with_pdc(api_key: str) -> bool:
    """Validate if API Key is still active with PDC"""
    try:
        request = Request(
            PDC_VALIDATE_URL,
            headers={'Authorization': f'Bearer {api_key}'},
            method='GET'
        )
        
        with urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('valid', False)
            
    except HTTPError as e:
        if e.code == 401:
            return False
        raise Exception(f'Validation failed: HTTP {e.code}')
    except Exception:
        return False

def save_config(api_key: str, token: str, expires_in: int, user_name: str = 'Unknown') -> str:
    """Save API Key and token to config file
    
    Args:
        api_key: PDC API Key
        token: Bearer token
        expires_in: Token lifetime in MINUTES (from PDC)
        user_name: User email from PDC
    """
    config_dir = Path.home() / '.oemcp'
    config_file = config_dir / 'config-pdc-cli.json'
    
    # Create directory if it doesn't exist
    config_dir.mkdir(parents=True, exist_ok=True)
    
    # CRITICAL: expires_in is in MINUTES (from PDC API)
    expiry_time = datetime.now() + timedelta(minutes=expires_in)
    
    config = {
        'api_key': api_key,
        'token': token,
        'token_expiry': expiry_time.isoformat(),
        'created_at': datetime.now().isoformat(),
        'user_name': user_name
    }
    
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    # Set file permissions to user-only (600)
    os.chmod(config_file, 0o600)
    
    return str(config_file)

def reset_config() -> bool:
    """Remove stored configuration"""
    config_file = Path.home() / '.oemcp' / 'config-pdc-cli.json'
    
    if config_file.exists():
        config_file.unlink()
        print('✅ Configuration removed successfully')
        return True
    else:
        print('ℹ️  No configuration found')
        return False

def display_credentials(api_key: str, token: str, expires_in: int, output_format: str, config_file: str):
    """Display credentials in different formats
    
    Args:
        expires_in: Token lifetime in MINUTES (from PDC)
    """
    # CRITICAL: expires_in is in MINUTES (from PDC API)
    expiry_date = datetime.now() + timedelta(minutes=expires_in)
    
    print('\n✅ Authentication successful!\n')
    
    if output_format == 'json':
        output = {
            'apiKey': api_key,
            'token': token,
            'expiresIn': expires_in,
            'expiresAt': expiry_date.isoformat()
        }
        print(json.dumps(output, indent=2))
    
    elif output_format == 'env':
        print(f'export OE_ABL_MCP_API_KEY="{api_key}"')
        print(f'export OE_ABL_MCP_TOKEN="{token}"')
    
    else:  # text format
        print('═' * 80)
        print('✅ AUTHENTICATION SUCCESSFUL')
        print('═' * 80)
        print('')
        print('API Key:')
        print('─' * 80)
        print(api_key)
        print('─' * 80)
        print(f'Token expires: {expiry_date.strftime("%Y-%m-%d %H:%M:%S")} (in {expires_in} minutes)')
        print(f'Config saved: {config_file}')
        print('')
        print('═' * 80)
        print('📋 NEXT STEPS')
        print('═' * 80)
        print('')
        print('1. Find your MCP client config file:')
        print('')
        print('   • Claude Desktop (Windows): %APPDATA%\\Claude\\claude_desktop_config.json')
        print('   • Claude Desktop (Mac): ~/Library/Application Support/Claude/claude_desktop_config.json')
        print('   • Claude CLI: ~/.config/claude/mcp.json')
        print('   • Amazon Q CLI: ~/.config/amazon-q/mcp.json')
        print('')
        print('2. Add this configuration (replace <PATH> with actual proxy location):')
        print('')
        print('   {')
        print('     "mcpServers": {')
        print('       "openedge-abl": {')
        print('         "command": "python3",')
        print('         "args": ["<PATH>/mcp-pdc-proxy.py"]')
        print('       }')
        print('     }')
        print('   }')
        print('')
        print('   Example: "args": ["C:/scripts/mcp-pdc-proxy.py"]')
        print('')
        print('3. Restart your MCP client')
        print('')
        print('═' * 80)
        print('')
        print('✅ Done! The proxy will handle token refresh automatically.')
        print('')
        print('✅ You\'re all set! Just restart your MCP client (Claude Desktop, etc.)\n')

def main():
    parser = argparse.ArgumentParser(
        description='OpenEdge MCP Authentication - PDC Login Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Interactive login (recommended)
  python mcp-login.py

  # Login with API Key directly
  python mcp-login.py --api-key YOUR_API_KEY_HERE

  # Get credentials in JSON format (for automation)
  python mcp-login.py --format json

  # Reset stored credentials
  python mcp-login.py --reset

Configuration:
  API Key and token are saved to: ~/.oemcp/config-pdc-cli.json
  File permissions: 600 (user read/write only)

Workflow:
  1. Run this script once to authenticate with your PDC API Key
  2. Add mcp-pdc-proxy.py to your MCP config (NO API KEY NEEDED!)
  3. Proxy reads credentials from ~/.oemcp/config-pdc-cli.json automatically
  4. Proxy handles token refresh and API Key validation automatically

Security:
  - Tokens auto-refresh every 50 minutes (saved to config file)
  - API Key validated every 3 minutes
  - Revoked keys detected within 3 minutes
  - If API Key becomes invalid, proxy exits with error message
        '''
    )
    
    parser.add_argument('--api-key', help='PDC API Key for authentication')
    parser.add_argument('--format', choices=['text', 'json', 'env'], default='text',
                       help='Output format (default: text)')
    parser.add_argument('--reset', action='store_true',
                       help='Remove stored credentials')
    
    args = parser.parse_args()
    
    try:
        # Handle reset
        if args.reset:
            print('╔════════════════════════════════════════════════════════════════╗')
            print('║    OpenEdge MCP Authentication - Reset Configuration          ║')
            print('╚════════════════════════════════════════════════════════════════╝')
            reset_config()
            sys.exit(0)
        
        print('╔════════════════════════════════════════════════════════════════╗')
        print('║   OpenEdge MCP Authentication - PDC Login Tool                ║')
        print('╚════════════════════════════════════════════════════════════════╝')
        
        # Get API Key
        api_key = args.api_key
        
        if not api_key:
            print('\nEnter your Progress Data Cloud API Key:')
            print('(Minimum 20 characters)\n')
            api_key = getpass.getpass('API Key: ')
        
        if not api_key:
            print('\n❌ Error: API Key is required')
            sys.exit(1)
        
        # Validate API Key format
        if not validate_api_key(api_key):
            print('\n❌ Error: API Key must be at least 20 characters long')
            sys.exit(1)
        
        # Authenticate with PDC
        result = authenticate_pdc(api_key)
        
        # Validate token is active
        print('🔍 Validating API Key status...')
        if not validate_token_with_pdc(api_key):
            print('\n⚠️  Warning: API Key validation failed (may be revoked or inactive)')
        
        # Save config
        config_file = save_config(api_key, result['token'], result['expiresIn'], result.get('userName', 'Unknown'))
        
        # Display credentials
        display_credentials(api_key, result['token'], result['expiresIn'], 
                          args.format, config_file)
        
        sys.exit(0)
        
    except KeyboardInterrupt:
        print('\n\n❌ Cancelled by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Error: {str(e)}\n')
        sys.exit(1)

if __name__ == '__main__':
    main()
