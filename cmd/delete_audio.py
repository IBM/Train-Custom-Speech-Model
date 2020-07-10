# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)


##########################################################################
# Delete an audio source file from the acoustic model
##########################################################################

print("\nDeleting audio source ...")

audio_name = env.get_arg("name of audio source")
headers = {'Content-Type' : "application/json"}
uri = env.get_endpoint() + "/v1/acoustic_customizations/"+env.get_acoustic_id()+"/audio/"+audio_name
r = requests.delete(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers)

print("Delete audio source returns: ", r.status_code)
if r.status_code != 200:
   print("Failed to delete audio source")
   print(r.text)
   sys.exit(-1)
else:
   sys.exit(0)
