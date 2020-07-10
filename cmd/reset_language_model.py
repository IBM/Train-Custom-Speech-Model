# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##########################################################################
# Resets a custom language model by removing all corpora, grammars, and words from
# the model. Resetting a custom language model initializes the model to its state
# when it was first created. Metadata such as the name and language of the model
# are preserved, but the model's words resource is removed and must be re-created.
# You must use credentials for the instance of the service that owns a model to reset it.
##########################################################################

print("\nResetting custom language model...")

headers = {'Content-Type' : "application/json"}
uri = env.get_endpoint() + "/v1/customizations/"+env.get_language_id()+"/reset"
r = requests.post(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers)

print("Reset model returns: ", r.status_code)
print(r.text)

sys.exit(0)
