# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##########################################################################
# Create a custom language model
##########################################################################

model_name = env.get_arg("language model name")
print("\nCreate a new language custom model: "+model_name)

headers = {'Content-Type' : "application/json"}
data = {"name" : model_name, "base_model_name" : "en-US_NarrowbandModel", "description" : "My narrowband language model"}
uri = env.get_endpoint() + "/v1/customizations/"
jsonObject = json.dumps(data).encode('utf-8')
r = requests.post(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers, data=jsonObject)

print("Create model returns: ", r.status_code)
print(r.text)

sys.exit(0)
