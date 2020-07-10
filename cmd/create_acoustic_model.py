# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##########################################################################
# Create a new custom acoustic model
##########################################################################

model_name = env.get_arg("acoustic model name")
print("\nCreate a new acoustic custom model: "+model_name)

headers = {'Content-Type' : "application/json"}
data = {"name" : model_name, "base_model_name" : "en-US_NarrowbandModel", "description" : "My narrowband acoustic model"}
uri = env.get_endpoint() + "/v1/acoustic_customizations"
jsonObject = json.dumps(data).encode('utf-8')
resp = requests.post(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers, data=jsonObject)

print("Create acoustic models returns: ", resp.status_code)
if resp.status_code != 201:
   print("Failed to create acoustic model")
   print(resp.text)
   sys.exit(-1)
else:
   print(resp.text)
   sys.exit(0)
