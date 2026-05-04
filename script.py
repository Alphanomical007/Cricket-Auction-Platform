import os
import shutil
import urllib.parse

src_dir = r"c:\Users\anike\OneDrive\Desktop\Superongo\Cricket-Auction-Platform-main\IMAGE (File responses)"
dst_dir = r"c:\Users\anike\OneDrive\Desktop\Superongo\Cricket-Auction-Platform-main\frontend\public\players"

os.makedirs(dst_dir, exist_ok=True)

csv_lines = ["Name,Email,Phone,Batting,Bowling,Fielding,Profile Photo"]

for filename in os.listdir(src_dir):
    if not os.path.isfile(os.path.join(src_dir, filename)):
        continue
    
    # Copy file
    src_path = os.path.join(src_dir, filename)
    dst_path = os.path.join(dst_dir, filename)
    shutil.copy2(src_path, dst_path)
    
    name = os.path.splitext(filename)[0]
    email = f"{name.replace(' ', '').lower()}@example.com"
    phone = ""
    # Use urllib.parse.quote for the URL path
    photo_url = f"/players/{urllib.parse.quote(filename)}"
    
    csv_lines.append(f'"{name}","{email}","{phone}",5.0,5.0,5.0,"{photo_url}"')

csv_content = "\n".join(csv_lines)
with open(r"c:\Users\anike\OneDrive\Desktop\Superongo\Cricket-Auction-Platform-main\players_bulk.csv", "w", encoding="utf-8") as f:
    f.write(csv_content)
    
print("Created frontend/public/players and players_bulk.csv")
