#!/usr/bin/env python3
"""
IoT Device Manager CLI
Simple command-line tool for managing IoT devices via vendor API
"""

import requests
import json
import time
from datetime import datetime
from typing import Optional, Dict, List

class IoTDeviceManager:
    def __init__(self):
        self.base_url: Optional[str] = None
        self.tenant_code: Optional[str] = None
        self.token: Optional[str] = None
        self.token_expiration: Optional[str] = None
        self.vendor_id: Optional[int] = None
        self.session = requests.Session()

    def clear_screen(self):
        import os
        os.system('cls' if os.name == 'nt' else 'clear')

    def print_header(self):
        print("=" * 60)
        print("📱 IoT Device Manager CLI")
        print("=" * 60)
        if self.token:
            print(f"✅ Logged in | Vendor ID: {self.vendor_id or 'N/A'}")
            print(f"🔑 Token expires: {self.token_expiration or 'Unknown'}")
        else:
            print("❌ Not logged in")
        print("=" * 60)
        print()

    def show_menu(self):
        print("\n📋 Main Menu:")
        print("1. Login to Vendor API")
        print("2. List Device Profiles")
        print("3. Import Devices from API")
        print("4. Bulk Create Devices")
        print("5. Send Test Data (Simulator)")
        print("6. View Current Config")
        print("0. Exit")
        print()

    def login(self):
        """Login to vendor API and get token"""
        print("\n🔐 Login to Vendor API")
        print("-" * 40)

        self.base_url = input("Enter API Base URL (e.g., http://api.example.com:8080): ").strip()
        self.tenant_code = input("Enter Tenant Code: ").strip()
        username = input("Enter Username: ").strip()
        password = input("Enter Password: ").strip()

        try:
            url = f"{self.base_url}/v1/login/{self.tenant_code}"
            response = self.session.post(
                url,
                json={"username": username, "password": password},
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                result = data.get('result', data)
                self.token = result.get('token')
                self.token_expiration = result.get('tokenExpirationDate')

                print(f"\n✅ Login successful!")
                print(f"🔑 Token: {self.token[:50]}...")
                print(f"⏰ Expires: {self.token_expiration}")

                # Try to get vendor ID from devices endpoint
                self._fetch_vendor_id()

            else:
                print(f"\n❌ Login failed: {response.status_code}")
                print(f"Response: {response.text}")

        except Exception as e:
            print(f"\n❌ Error during login: {e}")

        input("\nPress Enter to continue...")

    def _fetch_vendor_id(self):
        """Fetch vendor ID from devices API"""
        try:
            devices = self._get_devices()
            if devices and len(devices) > 0:
                self.vendor_id = devices[0].get('vendorId')
                print(f"📦 Auto-detected Vendor ID: {self.vendor_id}")
        except:
            pass

    def _get_devices(self, endpoint: str = "/v1/vendor/devices") -> List[Dict]:
        """Get devices from API"""
        if not self.token:
            print("❌ Please login first")
            return []

        try:
            url = f"{self.base_url}{endpoint}"
            response = self.session.get(
                url,
                headers={"x-xsrf-token": self.token},
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                # Handle different response structures
                if isinstance(data, dict):
                    if 'result' in data:
                        if isinstance(data['result'], dict) and 'contents' in data['result']:
                            return data['result']['contents']
                        elif isinstance(data['result'], list):
                            return data['result']
                    elif 'devices' in data:
                        return data['devices']
                elif isinstance(data, list):
                    return data
                return []
            else:
                print(f"❌ Failed to fetch devices: {response.status_code}")
                return []

        except Exception as e:
            print(f"❌ Error fetching devices: {e}")
            return []

    def list_device_profiles(self):
        """List all device profiles"""
        if not self.token:
            print("\n❌ Please login first")
            input("Press Enter to continue...")
            return

        print("\n📋 Device Profiles")
        print("-" * 40)

        try:
            url = f"{self.base_url}/v1/vendor/device-profiles"
            response = self.session.get(
                url,
                headers={"x-xsrf-token": self.token},
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                profiles = data.get('result', [])

                if profiles:
                    print(f"\nFound {len(profiles)} profiles:\n")
                    for profile in profiles:
                        print(f"ID: {profile.get('id')}")
                        print(f"Name: {profile.get('name')}")
                        print(f"Max Inactive Time: {profile.get('maxInactiveTime')}s")
                        print(f"Description: {profile.get('description', 'N/A')}")
                        print("-" * 40)
                else:
                    print("No profiles found")
            else:
                print(f"❌ Failed: {response.status_code}")
                print(response.text)

        except Exception as e:
            print(f"❌ Error: {e}")

        input("\nPress Enter to continue...")

    def import_devices(self):
        """Import devices from vendor API"""
        if not self.token:
            print("\n❌ Please login first")
            input("Press Enter to continue...")
            return

        print("\n📥 Import Devices")
        print("-" * 40)

        endpoint = input("Enter endpoint (default: /v1/vendor/devices): ").strip() or "/v1/vendor/devices"
        devices = self._get_devices(endpoint)

        if devices:
            print(f"\n✅ Found {len(devices)} devices\n")
            for i, device in enumerate(devices[:5], 1):  # Show first 5
                print(f"{i}. {device.get('name')} (ID: {device.get('customId')})")
                print(f"   Profile: {device.get('deviceProfileId')}, Vendor: {device.get('vendorId')}")

            if len(devices) > 5:
                print(f"... and {len(devices) - 5} more")

            # Save to file
            filename = f"imported_devices_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w') as f:
                json.dump(devices, f, indent=2)
            print(f"\n💾 Saved to {filename}")
        else:
            print("No devices found")

        input("\nPress Enter to continue...")

    def bulk_create_devices(self):
        """Bulk create devices"""
        if not self.token:
            print("\n❌ Please login first")
            input("Press Enter to continue...")
            return

        if not self.vendor_id:
            vendor_id_input = input("\nEnter Vendor ID: ").strip()
            if vendor_id_input:
                self.vendor_id = int(vendor_id_input)
            else:
                print("❌ Vendor ID is required")
                input("Press Enter to continue...")
                return

        print("\n🏭 Bulk Device Creator")
        print("-" * 40)

        try:
            device_count = int(input("Number of devices to create: "))
            device_prefix = input("Device name prefix (e.g., 'device'): ").strip()
            profile_id = int(input("Device Profile ID: "))
            delay = float(input("Delay between creations (seconds, default: 0.1): ") or "0.1")

            print(f"\n🚀 Creating {device_count} devices...")
            print(f"Prefix: {device_prefix}, Profile: {profile_id}, Vendor: {self.vendor_id}")
            print("-" * 40)

            created = 0
            failed = 0

            for i in range(1, device_count + 1):
                device_name = f"{device_prefix}_{i}"
                custom_id = f"id:{device_prefix}_{i}"

                device_data = {
                    "brand": "IoT Simulator",
                    "customId": custom_id,
                    "name": device_name,
                    "deviceProfileId": profile_id,
                    "vendorId": self.vendor_id,
                    "model": "SIM-v1",
                    "status": "active",
                    "transferEnabled": False
                }

                try:
                    url = f"{self.base_url}/v1/vendor/device"
                    response = self.session.post(
                        url,
                        json=device_data,
                        headers={
                            "x-xsrf-token": self.token,
                            "Content-Type": "application/json"
                        },
                        timeout=10
                    )

                    if response.status_code in [200, 201]:
                        created += 1
                        print(f"✅ [{i}/{device_count}] Created: {device_name}")
                    else:
                        failed += 1
                        print(f"❌ [{i}/{device_count}] Failed: {device_name} - {response.status_code}")
                        print(f"   Error: {response.text[:100]}")

                except Exception as e:
                    failed += 1
                    print(f"❌ [{i}/{device_count}] Error: {device_name} - {e}")

                if i < device_count:
                    time.sleep(delay)

            print("\n" + "=" * 40)
            print(f"✅ Created: {created}")
            print(f"❌ Failed: {failed}")
            print(f"📊 Total: {device_count}")

        except ValueError as e:
            print(f"❌ Invalid input: {e}")
        except Exception as e:
            print(f"❌ Error: {e}")

        input("\nPress Enter to continue...")

    def send_test_data(self):
        """Send test data to a device"""
        if not self.token:
            print("\n❌ Please login first")
            input("Press Enter to continue...")
            return

        print("\n📡 Send Test Data")
        print("-" * 40)

        custom_id = input("Enter device custom ID: ").strip()
        sensor_code = input("Enter sensor code: ").strip()
        value = input("Enter value: ").strip()

        # Try to convert to number if possible
        try:
            value = float(value)
        except:
            pass

        timestamp = datetime.now().isoformat() + "+03:00"

        data = [{
            "customDeviceId": custom_id,
            "sensorCode": sensor_code,
            "timestamp": timestamp,
            "value": value
        }]

        try:
            url = f"{self.base_url}/v1/device/device-data"
            response = self.session.post(
                url,
                json=data,
                headers={
                    "x-xsrf-token": self.token,
                    "Content-Type": "application/json"
                },
                timeout=10
            )

            if response.status_code == 200:
                print(f"\n✅ Data sent successfully!")
                print(f"Response: {response.text}")
            else:
                print(f"\n❌ Failed: {response.status_code}")
                print(f"Response: {response.text}")

        except Exception as e:
            print(f"\n❌ Error: {e}")

        input("\nPress Enter to continue...")

    def view_config(self):
        """View current configuration"""
        print("\n⚙️ Current Configuration")
        print("-" * 40)
        print(f"Base URL: {self.base_url or 'Not set'}")
        print(f"Tenant Code: {self.tenant_code or 'Not set'}")
        print(f"Token: {(self.token[:30] + '...') if self.token else 'Not set'}")
        print(f"Token Expiration: {self.token_expiration or 'Not set'}")
        print(f"Vendor ID: {self.vendor_id or 'Not set'}")
        input("\nPress Enter to continue...")

    def run(self):
        """Main application loop"""
        while True:
            self.clear_screen()
            self.print_header()
            self.show_menu()

            choice = input("Enter your choice: ").strip()

            if choice == '1':
                self.login()
            elif choice == '2':
                self.list_device_profiles()
            elif choice == '3':
                self.import_devices()
            elif choice == '4':
                self.bulk_create_devices()
            elif choice == '5':
                self.send_test_data()
            elif choice == '6':
                self.view_config()
            elif choice == '0':
                print("\n👋 Goodbye!")
                break
            else:
                print("\n❌ Invalid choice")
                input("Press Enter to continue...")

def main():
    manager = IoTDeviceManager()
    try:
        manager.run()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted by user. Goodbye!")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
