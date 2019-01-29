# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
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

print "\nTranscribe an audio using a custom language custom model..."

audio_file = env.get_arg("audio file to transcribe")
uri = "https://stream.watsonplatform.net/speech-to-text/api/v1/recognize?model=en-US_NarrowbandModel&language_customization_id="+env.get_language_id()+"&acoustic_customization_id="+env.get_acoustic_id()
with open(audio_file, 'rb') as f:
    r = requests.post(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers, data=f)

print "Transcribe returns: ", r.status_code
print r.text

sys.exit(0)
