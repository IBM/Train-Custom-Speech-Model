# -*- coding: utf-8 -*-
import requests
import json
import codecs
import os, sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

headers = {'Content-Type' : "audio/wav"}

##########################################################################
# Transcribe an audio file using a custom language and acoustic model
# Need to specify in the API call:
# - the base model
# - the language_customization_id
# - the acoustic_customization_id
##########################################################################

print("\nTranscribe an audio using: ")

try:
    language_id = "&language_customization_id="+os.environ['LANGUAGE_ID']
    print(" - custom language model (id: %s)" % os.environ['LANGUAGE_ID'])
except:
    language_id = ""
    print(" - base language model")

try:
    acoustic_id = "&acoustic_customization_id="+os.environ['ACOUSTIC_ID']
    print(" - custom acoustic model (id: %s)" % os.environ['ACOUSTIC_ID'])
except:
    acoustic_id = ""
    print(" - base acoustic model")


audio_file = env.get_arg("audio file to transcribe")
uri = env.get_endpoint() + "/v1/recognize?model=en-US_NarrowbandModel"+language_id+acoustic_id
with open(audio_file, 'rb') as f:
    r = requests.post(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers, data=f)

output_file = open(audio_file.replace('.wav','') + '.transcript','w')
transcript = ""
print(r.json())
for result in r.json()['results']:
    for alternative in result['alternatives']:
        transcript += alternative['transcript']

print("Transcription: ")
print(transcript)

output_file.write(transcript)
output_file.close()

sys.exit(0)
