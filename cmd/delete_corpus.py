# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##########################################################################
# Delete a corpus file from a custom language model
##########################################################################

corpusName = env.get_arg("corpus filename")

print("\nDeleting corpus ...")

headers = {'Content-Type' : "application/json"}
uri = env.get_endpoint() + "/v1/customizations/"+env.get_language_id()+"/corpora/"+corpusName
r = requests.delete(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers)

print("Delete corpus returns: ", r.status_code)
if r.status_code != 200:
   print("Failed to get corpus")
   print(r.text)
   sys.exit(-1)
else:
   sys.exit(0)
