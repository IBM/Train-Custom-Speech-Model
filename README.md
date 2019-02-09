

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
2. The user sets up access to the Watson Speech service by configuring the credential.
3. The user uses the provided web front-end or command line to run training using the batch of data.
4. The user interactively tests the new custom Speech model by speaking phrases to the computer microphone and verify the text transcription returned from the model.
5. If the text transcription is not correct, the user can make correction and resubmit the updated data for training.
6. Several users can work on the same custom model at the same time.  


## Included components

* [IBM Watson Speech](https://www.ibm.com/watson/services/speech-to-text): easily convert audio and voice into written text for quick understanding of content.
* Web front-end application to run the training.
* A real dataset with 16 hours of medical dictation, provided by [ezDI](https://www.ezdi.com).


## Featured technologies
* [Watson Speech recognition](https://console.bluemix.net/docs/services/speech-to-text/getting-started.html#gettingStarted): advanced models for processing audio signals and language context can accurately transcribe spoken voice into text.
* [Watson Speech customization](https://console.bluemix.net/docs/services/speech-to-text/custom.html#customization): ability to further train the model to improve the accuracy for your special domain.
* [AI in medical services](https://www.ezdi.com):  save time for medical care providers by automating tasks such as entering data into Electronic Medical Record. 

# Watch the Video

[![](http://img.youtube.com/XXXXXX.jpg)](https://www.youtube.com/watch?v=XXXXXX)

# Steps

1. [Create the Watson Speech services](#1-create-watson-services)
2. [Set up your code](#2-set-up-your-code)
3. [Download and prepare the data](#3-prepare-the-data)
4. [Train the language model](#4-train-the-language-model)
5. [Train the acoustic model](#5-train-the-acoustic-model)
6. [Transcribe your dictation](#6-transcribe-your-dictation)
7. [Correct the transcription](#7-correct-the-transcription)



### 1. Create Watson services 

Create the following services with IBM Cloud:

* Get your [credential for the IBM Cloud](https://console.bluemix.net/docs/services/watson/getting-started-credentials.html), to be used in the next step.


### 2. Set up your code

Clone the code pattern. In a terminal, run:

```
$ git clone https://github.com/IBM/Train-Custom-Speech-Model
```

We’ll be using a *nodejs* web service running locally with a GUI implemented in *react*.  You will need python 2.7 and npm.

To allow the web service to connect to Watson with your account, create a file named *client/package.json* by copying the sample file *services.sample.json* from the root directory.  Update your username and password in the file using your credential from the previous step.

The web service will require a local login. The local user accounts are defined in the file *model/user.json*.  The pre-defined user/password are *user1/user1* and *user2/user2*.  You can modify the users as needed.

Install and start the web service by running the following commands in the root directory: 

```
cd client
npm install
cd ..
npm run dev
```

On your browser, go to http://localhost:3000


### 3. Prepare the data

Go to the [ezDI webpage](https://www.ezdi.com/open-datasets/) and download the medical dictation dataset. The data includes the audio and the verbatim transcription done by human.

The transcription files are in the rtf format.  We need to convert them to plain text format.

```
pip install pyth 
python data/convert_rtf.py *.rtf
```

Data needs careful preparation since your deep learning model will only be as good as the data used in the training.  Preparation may include steps such as removing erroneous words in the text, bad audio recording, etc.  These step are typically very time-consuming with large dataset.   
Although the dataset from ezDI is already curated, a quick scan of the text transcription will reveal some filler text that would not help the training.  You can take a look to see these words.  

These unwanted text have been collected in the file *data/fixup.sed*.  We will remove these words by:

```
sed -f data/fixup.sed *.txt
```

The text and audio files are individual files.  For the purpose of training, we need to combine these files into single package.  
For the text, we can simply concatenate all the text file into one file, which is called the corpus.

```
cat *.txt > corpus-1
```

For the audio, we can archive them as zip or tar file.  Since the Watson API has a limit of 100MB per archive file, we will need to split up the audio files into 3 zip files:

```
zip 
zip
zip
```


### 4. Train the language model


### 5. Train the acoustic model


### 6. Transcribe your dictation


### 7. Correct the transcription




# Sample output

![](doc/source/images/sample_screenshot.png)

# Links

* [Demo on Youtube](https://www.youtube.com/watch?v=Jxi7U7VOMYg)
* asdf


# Troubleshooting

* Error: message

  > Common error conditions ...


# License
[Apache 2.0](LICENSE)