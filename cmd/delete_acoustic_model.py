# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##########################################################################
# Delete a custom acoustic model
##########################################################################

print("\nDeleting custom acoustic models...")

headers = {'Content-Type' : "application/json"}
uri = env.get_endpoint() + "/v1/acoustic_customizations/"+env.get_acoustic_id()
resp = requests.delete(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers)

print("Delete acoustic models returns: ", resp.status_code)
if resp.status_code != 200:
   print("Failed to delete acoustic model")
   print(resp.text)
   sys.exit(-1)

sys.exit(0)
