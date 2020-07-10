# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##########################################################################
# Get list of all custom models
##########################################################################

print("\nGetting all models...")

headers = {'Content-Type' : "application/json"}
uri = env.get_endpoint() + "/v1/models"
r = requests.get(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers)

print("Get all models returns: ", r.status_code)
print(r.text)

sys.exit(0)
