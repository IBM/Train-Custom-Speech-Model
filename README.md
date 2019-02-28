# Create a customer Watson Speech model using new data from your special domain

In this developer journey, we will create a custom speech to text model. Watson Speech service is among the best in the industry.  However, like other Cloud Speech services, it was trained with general conversational speech for general use;  therefore it may not perform well in specialized domain such as medicine, law, sport, etc.  To improve the accuracy of the speech to text service, you can leverage transfer learning by training the existing AI model with new data from your domain.  We will use a medical speech data set to illustrate the process, but you can use any specialized data set.

When the reader has completed this journey, they will understand how to:

* Prepare audio data and transcription for training a speech to text model
* Work with Watson Speech service through API calls
* Train a custom speech to text model with a batch of data
* Train the model with continuous user feedback

![](doc/source/images/architecture.png)

## Flow

1. The user downloads the custom dataset and prepares the audio and text data for training.
1. The user sets up access to the Watson Speech service by configuring the credential.
1. The user uses the provided web front-end or command line to run training using the batch of data.
1. The user interactively tests the new custom Speech model by speaking phrases to the computer microphone and verify the text transcription returned from the model.
1. If the text transcription is not correct, the user can make correction and resubmit the updated data for training.
1. Several users can work on the same custom model at the same time.

## Included components

* [IBM Watson Speech to Text](https://www.ibm.com/watson/services/speech-to-text): easily convert audio and voice into written text for quick understanding of content.
* A real dataset with 16 hours of medical dictation, provided by [ezDI](https://www.ezdi.com).

## Featured technologies

* [Node.js](https://nodejs.org/): An open-source JavaScript run-time environment for executing server-side JavaScript code.
* [React](https://reactjs.org/): A JavaScript library for building User Interfaces.
* [Watson Speech recognition](https://console.bluemix.net/docs/services/speech-to-text/getting-started.html#gettingStarted): advanced models for processing audio signals and language context can accurately transcribe spoken voice into text.
* [Watson Speech customization](https://console.bluemix.net/docs/services/speech-to-text/custom.html#customization): ability to further train the model to improve the accuracy for your special domain.
* [AI in medical services](https://www.ezdi.com):  save time for medical care providers by automating tasks such as entering data into Electronic Medical Record.

# Watch the Video

[![](http://img.youtube.com/XXXXXX.jpg)](https://www.youtube.com/watch?v=XXXXXX)

# Steps

1. [Clone the repo](#1-clone-the-repo)
1. [Create IBM Cloud services](#2-create-ibm-cloud-services)
1. [Configure credentials](#3-configure-credentials)
1. [Download and prepare the data](#4-download-and-prepare-the-data)
1. [Train the models](#5-train-the-models)
1. [Transcribe your dictation](#6-transcribe-your-dictation)
1. [Correct the transcription](#7-correct-the-transcription)

## 1. Clone the repo

```bash
git clone https://github.com/IBM/Train-Custom-Speech-Model
```

## 2. Create IBM Cloud services

Create the following services:

* [**Watson Speech To Text**](https://cloud.ibm.com/catalog/services/speech-to-text)

> Note: In order to perform customization, you will need to select the `Standard` paid plan.

## 3. Configure credentials

From your **Watson Speech to Text** service instance, select the `Service Credentials` tab.

If no credentials exist, select the `New Credential` button to create a new set of credentials.

Store these values as they will be needed in future steps.

## 4. Download and prepare the data

Go to the [ezDI](https://www.ezdi.com/open-datasets/) web site and download both the medical dictation audio files and the transcribed text files. The downloaded files will be contained in zip files.

Create both an `Audio` and `Documents` subdirectory inside the `data` directory and then extract the downloaded zip files into their respective locations.

The transcription `Document` files are in **rtf** format, and need to be converted to plain text. Use the following bash script to iterate through and convert all of the **rtf** files.

> Note: Ensure that you have Python 2.7 installed.

```python
pip install pyth
for name in `ls Documents/*.rtf`;
do
  python convert_rtf.py $name
done
```

The data needs careful preparation since our deep learning model will only be as good as the data used in the training.  Preparation may include steps such as removing erroneous words in the text, bad audio recording, etc.  These steps are typically very time-consuming when dealing with large datasets.

Although the dataset from `ezDI` is already curated, a quick scan of the text transcription files will reveal some filler text that would not help the training. You can take a look to see these words.

These unwanted text strings have been collected in the file [data/fixup.sed](data/fixup.sed) and can be removed using the *sed* utility.

For the purpose of training, we will need to combine all text files into a into single package, called a `corpus` file.

To remove the unwanted text strings and to combine all of the text files into a single `corpus` file, perform the following command:

```bash
sed -f fixup.sed Documents/*.txt > corpus-1.input
```

For the audio files, we can archive them as zip or tar files.  Since the Watson Speech to Text API has a limit of 100MB per archive file, we will need to split up the audio files into 3 zip files.  We will also set aside the first 5 audio files for testing.

```bash
zip audio-set1.zip -xi Audio/[6-9].wav Audio/[1-7][0-9].wav
zip audio-set2.zip -xi Audio/[8-9][0-9].wav Audio/1[0-6][0-9].wav
zip audio-set3.zip -xi Audio/1[7-9][0-9].wav Audio/2[0-4][0-9].wav
```

## 5. Train the models

To train the language and acoustic models, you can either run the application or use the command line interface. Or you can mix as desired, since both are working with the same data files and services.

### a. Run the application

The application is a *nodejs* web service running locally with a GUI implemented in *React*.

* Install [Node.js](https://nodejs.org/en/) runtime or NPM.

To allow the web service to connect to your **Watson Speech to Text** service, create in the root directory a file named `services.json` by copying the sample file `services.sample.json`.  Update the apikey in the file with your api key you retrieved in [Step 3](#3-configure-credentials).

```json
{
  "services": {
    "code-pattern-custom-language-model": [
      {
        "credentials": {
          "apikey": "<your api key>",
          "url": "https://stream.watsonplatform.net/speech-to-text/api"
        },
        "label": "speech_to_text",
        "name": "code-pattern-custom-language-model"
      }
    ]
  }
}
```

The application will require a local login. The local user accounts are defined in the file [model/user.json](model/user.json).  The pre-defined user/passwords are `user1/user1` and `user2/user2`. You can modify the users as needed.

Install and start the application by running the following commands in the root directory:

```bash
cd client
npm install
cd ..
npm install
npm run dev
```

The local nodejs web server will automatically open your browser to [http://localhost:3000](http://localhost:3000).

Select the `Train` tab to show the training options. Train both the `Language Model` and `Acoustic Model`.

> Note: Training the acoustic model can potentially take hours to complete.

### b. Use the Command Line interface

If you prefer to use the command line, set the following environment variables. Update the `<your-iam-api-key>` value with your api key you retrieved in [Step 3](#3-configure-credentials).

```bash
export USERNAME=apikey
export PASSWORD=<your-iam-api-key>
```

#### Train the language model

Since the audio files are sampled at the 8Khz rate, we will need to use the narrow band model and this is coded in the python command line.

> Note: The application will use the name "custom-model-1" for the language model, so we will use the same name in the command line.

To create your custom language model and your corpus of medical dictation, run:

```bash
python ../cmd/create_language_model.py "custom-model-1"
```

This script will return the ID of your custom model. Use it to set the following environment variable:

```bash
export LANGUAGE_ID=<id_for_your_model>
```

> Note: You can also obtain the ID by using the following command:
>
>```bash
>python ../cmd/list_language_model.py
>```

The custom model will stay in the *"pending"* state until a corpus of text is added.  Add the medical transcription file we created in an earlier step.

```bash
python ../cmd/add_corpus.py corpus-1.input
python ../cmd/list_corpus.py
```

This step will also save a new list of `Out-Of-Vocabulary` words in a file.  It is useful to check the words to see if there are any unexpected words that you don't want to train the model with.

The status of the custom language model should now be set to *"ready"*. Now we can train the language model using the medical transcription.

```bash
python ../cmd/train_language_model.py
```

Training is asynchronous and may take some time depending on the system workload.
You can check for completion with `cmd/list_language_model.py`.  When training is complete, the status will change from *"training"* to *"available"*.

#### Train the acoustic model

Create the custom acoustic model based on the custom language model.

> Note: The application will use the name "Acoustic model 1" for the acoustic model, so we will use the same name in the command line.

```bash
python ../cmd/create_acoustic_model.py "Acoustic model 1"
```

This script will return the ID of your custom acoustic model. Use it to set the following environment variable:

```bash
export ACOUSTIC_ID=<id_for_your_model>
```

The custom acoustic model will be in the *"pending"* state until some audio data is added.  Add the 3 zip files containing the audio clips with the following commands:

```bash
python ../cmd/add_audio.py audio-set1.zip
python ../cmd/add_audio.py audio-set2.zip
python ../cmd/add_audio.py audio-set3.zip
python ../cmd/list_audio.py
```

> Note: it may take some time to process each audio file.  If processing is not completed yet, the command will return a *409* error message;  in this case, simply retry later.

Whe the status of the custom acoustic model is set  to *"ready"*, you can start the training by running:

```bash
python ../cmd/train_acoustic_model.py
```

Training the acoustic model is asynchronous and can potentially take hours to complete. To determine when training is completed, you can query the model and check if the status has changed from *"traning"* to *"available"*.

```bash
python ../cmd/list_acoustic_model.py
```

## 6. Transcribe your dictation

Record your medical dictation in wav format using 8KHz sampling rate.

If running the application, click on the `Transcribe` tab and then browse to your wav file.

If using the command line, enter the following:

```bash
python ../cmd/transcribe.py <my_dictation.wav>
```

## 7. Correct the transcription

# Sample output

![](doc/source/images/sample_screenshot.png)

# Links

* [Demo on Youtube](https://www.youtube.com/watch?v=Jxi7U7VOMYg)
* asdf


# Troubleshooting

* Error: message

  > Common error conditions ...


# License

This code pattern is licensed under the Apache Software License, Version 2.  Separate third party code objects invoked within this code pattern are licensed by their respective providers pursuant to their own separate licenses. Contributions are subject to the [Developer Certificate of Origin, Version 1.1 (DCO)](https://developercertificate.org/) and the [Apache Software License, Version 2](https://www.apache.org/licenses/LICENSE-2.0.txt).

[Apache Software License (ASL) FAQ](https://www.apache.org/foundation/license-faq.html#WhatDoesItMEAN)
