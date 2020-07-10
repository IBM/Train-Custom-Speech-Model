# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##########################################################################
# Initiates the training of a custom acoustic model with new audio resources
# using a language model as the base
# A status of available means that the custom model is trained and ready to use.
##########################################################################

print("\nTrain custom acoustic model...")

headers = {'Content-Type' : "application/json"}
uri = env.get_endpoint() + "/v1/acoustic_customizations/"+env.get_acoustic_id()+"/train?custom_language_model_id="+env.get_language_id()
r = requests.post(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers)

print("Train acoustic model returns: ", r.status_code)

sys.exit(0)
