# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##########################################################################
# Add an archive of audio files (wav files)
# You can add multiple audio sources to an acousic model
##########################################################################

audio_filename = env.get_arg("audio filename")
print("\nAdding audio source ...")

headers = {'Content-Type' : "application/zip"}
uri = env.get_endpoint() + "/v1/acoustic_customizations/"+env.get_acoustic_id()+"/audio/"+audio_filename

with open(audio_filename, 'rb') as f:
   r = requests.post(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers, data=f)

print("Adding audio source returns: ", r.status_code)
if r.status_code != 201:
   print("Failed to add audio source")
   print(r.text)
   sys.exit(-1)
else:
   sys.exit(0)
