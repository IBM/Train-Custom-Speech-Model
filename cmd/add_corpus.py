# -*- coding: utf-8 -*-
import requests
import json
import codecs
import sys, time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import env

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

##########################################################################
# Step 1: Add a corpus file (plain text file)
##########################################################################
# 'dictation_fixed.txt' is name of local file containing the corpus to be uploaded
# 'dictation-1' is the name of the new corpus
# >>>> REPLACE THE VALUES BELOW WITH YOUR OWN CORPUS FILE AND NAME
#corpus_file = "dictation_fixed.txt"
#corpus_name = "dictation-1"
corpus_file = env.get_arg("corpus filename")
print("\nAdding corpus file: ", corpus_file)

headers = {'Content-Type' : "application/json"}
uri = env.get_endpoint() + "/v1/customizations/"+env.get_language_id()+"/corpora/"+corpus_file
with open(corpus_file, 'rb') as f:
   r = requests.post(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers, data=f)

print("Adding corpus file returns: ", r.status_code)
if r.status_code != 201:
   print("Failed to add corpus file")
   print(r.text)
   sys.exit(-1)

##########################################################################
# Step 2: Get status of corpus file just added.
# After corpus is uploaded, there is some analysis done to extract OOVs.
# You cannot upload a new corpus or words while this analysis is on-going so
# we need to loop until the status becomes 'analyzed' for this corpus.
##########################################################################
print("Checking status of corpus analysis...")

uri = env.get_endpoint() + "/v1/customizations/"+env.get_language_id()+"/corpora/"+corpus_file
r = requests.get(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers)
respJson = r.json()
status = respJson['status']
time_to_run = 10
while (status != 'analyzed'):
    time.sleep(10)
    r = requests.get(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers)
    respJson = r.json()
    status = respJson['status']
    print("status: ", status, "(", time_to_run, ")")
    time_to_run += 10

print("Corpus analysis done!")

##########################################################################
# Step 3:  get the list of all OOVs found
# This step is only necessary if user wants to look at the OOVs and
# validate the auto-added sounds-like field. Probably a good thing to do though.
##########################################################################
print("\nListing words...")

uri = env.get_endpoint() + "/v1/customizations/"+env.get_language_id()+"/words?sort=count"
r = requests.get(uri, auth=(env.get_username(),env.get_password()), verify=False, headers=headers)

print("Listing words returns: ", r.status_code)
file=codecs.open(env.get_language_id()+".OOVs.corpus", 'wb', 'utf-8')
file.write(r.text)
print("Words list from added corpus saved in file: ", env.get_language_id(), ".OOVs.corpus")

sys.exit(0)
