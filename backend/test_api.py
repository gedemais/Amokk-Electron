#!/usr/bin/env python3
"""
Simple API test script for AMOKK Mock Backend
Tests all endpoints and verifies they work correctly

Usage:
    python test_api.py

Make sure the backend is running on http://localhost:8000 first!
"""

import requests
import json
import time
from typing import Any, Dict

# API base URL
BASE_URL = "http://localhost:8000"

# ANSI color codes for pretty output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.OKCYAN}{'='*60}")
    print(f"🧪 {text}")
    print(f"{'='*60}{Colors.ENDC}")

def print_success(text: str):
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

def print_error(text: str):
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")

def print_info(text: str):
    print(f"{Colors.OKBLUE}ℹ️  {text}{Colors.ENDC}")

def print_warning(text: str):
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")

def test_connection() -> bool:
    """Test if backend is reachable"""
    print_header("Testing Backend Connection")

    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print_success(f"Backend is reachable at {BASE_URL}")
        return True
    except requests.ConnectionError:
        print_error(f"Cannot connect to backend at {BASE_URL}")
        print_info("Make sure the backend is running: python main.py")
        return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_get_status() -> bool:
    """Test GET /status endpoint"""
    print_header("Testing GET /status")

    try:
        response = requests.get(f"{BASE_URL}/status", timeout=5)
        response.raise_for_status()

        data = response.json()
        print_success("GET /status returned 200 OK")

        print(f"\n{Colors.OKBLUE}Current state:{Colors.ENDC}")
        print(json.dumps(data['state'], indent=2))

        return True
    except Exception as e:
        print_error(f"GET /status failed: {e}")
        return False

def test_get_local_data() -> bool:
    """Test GET /get_local_data endpoint"""
    print_header("Testing GET /get_local_data")

    try:
        response = requests.get(f"{BASE_URL}/get_local_data", timeout=5)
        response.raise_for_status()

        data = response.json()
        print_success("GET /get_local_data returned 200 OK")

        print(f"\n{Colors.OKBLUE}Dashboard data:{Colors.ENDC}")
        print(f"  remaining_games: {data['remaining_games']}")
        print(f"  first_launch: {data['first_launch']}")
        print(f"  game_timer: {data['game_timer']}")

        return True
    except Exception as e:
        print_error(f"GET /get_local_data failed: {e}")
        return False

def test_coach_toggle() -> bool:
    """Test PUT /coach_toggle endpoint"""
    print_header("Testing PUT /coach_toggle")

    try:
        # Toggle to false
        response = requests.put(
            f"{BASE_URL}/coach_toggle",
            json={"active": False},
            timeout=5
        )
        response.raise_for_status()
        print_success(f"PUT /coach_toggle with active=false returned 200 OK")
        print(f"  Response: {response.json()['message']}")

        time.sleep(0.5)

        # Toggle to true
        response = requests.put(
            f"{BASE_URL}/coach_toggle",
            json={"active": True},
            timeout=5
        )
        response.raise_for_status()
        print_success(f"PUT /coach_toggle with active=true returned 200 OK")
        print(f"  Response: {response.json()['message']}")

        return True
    except Exception as e:
        print_error(f"PUT /coach_toggle failed: {e}")
        return False

def test_assistant_toggle() -> bool:
    """Test PUT /assistant_toggle endpoint"""
    print_header("Testing PUT /assistant_toggle")

    try:
        # Toggle to false
        response = requests.put(
            f"{BASE_URL}/assistant_toggle",
            json={"active": False},
            timeout=5
        )
        response.raise_for_status()
        print_success(f"PUT /assistant_toggle with active=false returned 200 OK")
        print(f"  Response: {response.json()['message']}")

        time.sleep(0.5)

        # Toggle to true
        response = requests.put(
            f"{BASE_URL}/assistant_toggle",
            json={"active": True},
            timeout=5
        )
        response.raise_for_status()
        print_success(f"PUT /assistant_toggle with active=true returned 200 OK")
        print(f"  Response: {response.json()['message']}")

        return True
    except Exception as e:
        print_error(f"PUT /assistant_toggle failed: {e}")
        return False

def test_update_ptt_key() -> bool:
    """Test PUT /update_ptt_key endpoint"""
    print_header("Testing PUT /update_ptt_key")

    try:
        # Test with different keys
        keys = ["v", "shift+v", "alt+space"]

        for key in keys:
            response = requests.put(
                f"{BASE_URL}/update_ptt_key",
                json={"ptt_key": key},
                timeout=5
            )
            response.raise_for_status()
            print_success(f"PUT /update_ptt_key with key='{key}' returned 200 OK")
            print(f"  Response: {response.json()['message']}")
            time.sleep(0.3)

        return True
    except Exception as e:
        print_error(f"PUT /update_ptt_key failed: {e}")
        return False

def test_update_volume() -> bool:
    """Test PUT /update_volume endpoint"""
    print_header("Testing PUT /update_volume")

    try:
        # Test with different volumes
        volumes = [0, 50, 100]

        for volume in volumes:
            response = requests.put(
                f"{BASE_URL}/update_volume",
                json={"volume": volume},
                timeout=5
            )
            response.raise_for_status()
            print_success(f"PUT /update_volume with volume={volume} returned 200 OK")
            print(f"  Response: {response.json()['message']}")
            time.sleep(0.3)

        return True
    except Exception as e:
        print_error(f"PUT /update_volume failed: {e}")
        return False

def test_reset() -> bool:
    """Test POST /reset endpoint"""
    print_header("Testing POST /reset")

    try:
        response = requests.post(f"{BASE_URL}/reset", timeout=5)
        response.raise_for_status()

        data = response.json()
        print_success("POST /reset returned 200 OK")
        print(f"  {data['message']}")

        return True
    except Exception as e:
        print_error(f"POST /reset failed: {e}")
        return False

def main():
    """Run all tests"""
    print(f"\n{Colors.BOLD}{Colors.HEADER}")
    print("╔════════════════════════════════════════════╗")
    print("║   AMOKK Mock Backend - API Test Suite     ║")
    print("╚════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}")

    # Test connection first
    if not test_connection():
        return

    # Run all tests
    results = []

    results.append(("GET /status", test_get_status()))
    results.append(("GET /get_local_data", test_get_local_data()))
    results.append(("PUT /coach_toggle", test_coach_toggle()))
    results.append(("PUT /assistant_toggle", test_assistant_toggle()))
    results.append(("PUT /update_ptt_key", test_update_ptt_key()))
    results.append(("PUT /update_volume", test_update_volume()))
    results.append(("POST /reset", test_reset()))

    # Summary
    print_header("Test Summary")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = f"{Colors.OKGREEN}PASS{Colors.ENDC}" if result else f"{Colors.FAIL}FAIL{Colors.ENDC}"
        print(f"  {test_name:<30} {status}")

    print(f"\n{Colors.BOLD}Total: {passed}/{total} tests passed{Colors.ENDC}")

    if passed == total:
        print_success("All tests passed! 🎉")
    else:
        print_warning(f"{total - passed} test(s) failed")

    print()

if __name__ == "__main__":
    main()
