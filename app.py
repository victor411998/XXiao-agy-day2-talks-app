from flask import Flask, jsonify, render_template, request
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import os

app = Flask(__name__)

# In-memory cache variables to avoid hitting Google's feeds too frequently.
# Saves load time and prevents rate limits.
cached_data = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    global cached_data
    # Allow explicit force refresh from the UI
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    if cached_data and not force_refresh:
        return jsonify(cached_data)
        
    try:
        url = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'
        # Set user-agent to look like a standard browser request just in case
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        # Parse XML with ElementTree
        root = ET.fromstring(response.content)
        
        # XML Namespace mapping for Atom
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry_node in root.findall('atom:entry', ns):
            # Extract basic Atom entry metadata
            entry_id = entry_node.find('atom:id', ns)
            entry_id = entry_id.text if entry_id is not None else ""
            
            title = entry_node.find('atom:title', ns)
            title = title.text if title is not None else ""
            
            updated = entry_node.find('atom:updated', ns)
            updated = updated.text if updated is not None else ""
            
            link_node = entry_node.find("atom:link[@rel='alternate']", ns)
            if link_node is None:
                link_node = entry_node.find("atom:link", ns)
            link = link_node.attrib.get('href', '') if link_node is not None else ""
            
            content_node = entry_node.find('atom:content', ns)
            content_html = content_node.text if content_node is not None else ""
            
            # Sub-updates parser.
            # Google's release feed groups multiple updates under one day/entry,
            # separating them with <h3>Feature</h3>, <h3>Change</h3>, etc.
            updates = []
            if content_html:
                soup = BeautifulSoup(content_html, 'html.parser')
                current_type = "Update"
                current_elements = []
                
                for child in soup.contents:
                    # Ignore empty text elements at top level
                    if isinstance(child, str) and not child.strip():
                        continue
                        
                    if child.name == 'h3':
                        # If we have collected elements under a previous heading, save it
                        if current_elements:
                            update_html = "".join(str(e) for e in current_elements).strip()
                            update_text = BeautifulSoup(update_html, 'html.parser').get_text().strip()
                            if update_html:
                                updates.append({
                                    "type": current_type,
                                    "html": update_html,
                                    "text": update_text
                                })
                            current_elements = []
                        current_type = child.get_text().strip()
                    else:
                        current_elements.append(child)
                
                # Append the final block after the last <h3> (or only block)
                if current_elements:
                    update_html = "".join(str(e) for e in current_elements).strip()
                    update_text = BeautifulSoup(update_html, 'html.parser').get_text().strip()
                    if update_html:
                        updates.append({
                            "type": current_type,
                            "html": update_html,
                            "text": update_text
                        })
            
            # Fallback in case BeautifulSoup parsing fails or there is no <h3> headings
            if not updates and content_html:
                updates.append({
                    "type": "Update",
                    "html": content_html,
                    "text": BeautifulSoup(content_html, 'html.parser').get_text().strip()
                })
                
            entries.append({
                "id": entry_id,
                "date": title,
                "updated": updated,
                "link": link,
                "updates": updates
            })
            
        cached_data = entries
        return jsonify(entries)
        
    except Exception as e:
        print(f"Exception during feed parsing: {e}")
        return jsonify({"error": f"Failed to retrieve/parse feed: {str(e)}"}), 500

if __name__ == '__main__':
    # Local dev host
    app.run(debug=True, host='127.0.0.1', port=5000)
