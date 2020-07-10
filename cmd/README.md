# Manual interaction with Watson Speech service

This directory contains a number of short Python programs that invoke the API call to the `Watson Speech to Text` service.

These programs are derived from the [API description](https://cloud.ibm.com/apidocs/speech-to-text#introduction).

They can be used as simple command line tools to interact with the speech service, complementing the UI tool to illustrate the concept and operation of the speech service while allowing more flexibility. They are intended as working code examples and not a full featured command line interface.

The workflow is as follows:

1. Create a custom language model based on an existing base model
   - create_language_model.py
   - list_language_model.py
   - delete_language_model.py

2. Add one or more corpus to the custom language model.  The corpora are plain text files consisting of sentences used in your particular domain, such as medical transcription.
   - add_corpus.py
   - list_corpus.py
   - delete_corpus.py

3. Train the custom language model
   - train_language.py

4. Create a custom acoustic model
   - create_acoustic_model.py
   - list_acoustic_model.py
   - delete_acoustic_model.py

5. Add one or more audio sources to the custom acoustic model.  These are voice recordings in your particular domain, such as medical dictation.
   - add_audio.py
   - list_audio.py
   - delete_audio.py

6. Train the custom acoustic model
   - train_acoustic.py

7. Submit a new voice recording to transcribe to text, using both of your custom language and acoustic models.
   - transcribe.py

The python programs use the package *requests*. You can install by:

```bash
pip install requests
```

To run the Python programs, please set the following environment variables:

```bash
export USERNAME=apikey
export PASSWORD=<your_apikey>
export STT_ENDPOINT=<your_url>
export LANGUAGE_ID=<your_custom_language_model_id>
export ACOUSTIC_ID=<your_custom_acoustic_model_id>
```

You can obtain your apikey credentials from the [IBM Cloud page](https://console.bluemix.net/docs/services/watson/getting-started-credentials.html):

You can obtain the ID of your custom language or acoustic models by listing the models and using the *customization_id* attribute.
