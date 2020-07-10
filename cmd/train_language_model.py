# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##########################################################################
# Initiate the training of a custom language model with new resources such as
# corpora, grammars, and custom words
# A status of available means that the custom model is trained and ready to use.
##########################################################################

print("\nTrain custom language model...")

headers = {'Content-Type' : "application/json"}
uri = env.get_endpoint() + "/v1/customizations/"+env.get_language_id()+"/train"
r = requests.post(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers)

print("Train language model returns: ", r.status_code)

sys.exit(0)
