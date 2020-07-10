# -*- coding: utf-8 -*-
import os, sys

##########################################################################
# Set your IBM Cloud credentials in the environment variables USERNAME
# and PASSWORD
# o If you use IAM service credentials, leave USERNAME set to "apikey"
#   and set PASSWORD to the value of your IAM API key.
# o If you use pre-IAM service credentials, set the values to your USERNAME
#   and PASSWORD.
# See the following instructions for getting your own credentials:
#   https://console.bluemix.net/docs/services/watson/getting-started-credentials.html
##########################################################################

def get_username():
    try:
        return os.environ['USERNAME']
    except:
        print("Please set your username in the environment variable USERNAME.")
        print("If you use IAM service credentials, set USERNAME set to the string \"apikey\"")
        print("and set PASSWORD to the value of your IAM API key.")
        sys.exit(-1)


def get_password():
    try:
        return os.environ['PASSWORD']
    except:
        print("Please set your password in the environment variable PASSWORD")
        print("If you use IAM service credentials, set USERNAME set to the string \"apikey\"")
        print("and set PASSWORD to the value of your IAM API key.")
        sys.exit(-1)


def get_endpoint():
    try:
        return os.environ['STT_ENDPOINT']
    except:
        print("Please set the environment variable STT_ENDPOINT to the "
              "URL specified in your service credentials.")
        sys.exit(-1)


def get_language_id ():
    try:
        return os.environ['LANGUAGE_ID']
    except:
        print("Please set the id for your custom language model in the environment variable LANGUAGE_ID")
        sys.exit(-1)


def get_acoustic_id ():
    try:
        return os.environ['ACOUSTIC_ID']
    except:
        print("Please set the id for your custom acoustic model in the environment variable ACOUSTIC_ID")
        sys.exit(-1)


def get_arg(help_string):
    if len(sys.argv)==1:
        print("Please specify ", help_string)
        sys.exit(-1)
    else:
        return str(sys.argv[1])


