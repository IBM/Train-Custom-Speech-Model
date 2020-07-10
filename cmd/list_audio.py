# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##########################################################################
# List the audio sources for an acoustic model
##########################################################################

print("\nGetting audio sources ...")

headers = {'Content-Type' : "application/json"}
uri = env.get_endpoint() + "/v1/acoustic_customizations/"+env.get_acoustic_id()+"/audio/"
r = requests.get(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers)

print("Get audio sources returns: ", r.status_code)
if r.status_code != 200:
   print("Failed to get corpus")
   sys.exit(-1)
else:
   print(r.text)
   sys.exit(0)
