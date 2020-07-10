# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##########################################################################
# List the corpus for a custom langage model
##########################################################################

print("\nGetting corpus ...")

headers = {'Content-Type' : "application/json"}
uri = env.get_endpoint() + "/v1/customizations/"+env.get_language_id()+"/corpora/"
r = requests.get(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers)

print("Get corpus returns: ", r.status_code)
if r.status_code != 200:
   print("Failed to get corpus")
   sys.exit(-1)
else:
   print(r.text)
   sys.exit(0)
