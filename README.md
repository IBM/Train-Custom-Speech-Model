

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

Follow the instruction to set up your [Watson Speeck service](https://console.bluemix.net/docs/services/speech-to-text/getting-started.html#gettingStarted).  

* Select the Standard plan and create your *Speech To Text* service.  Note that this is a paid plan; the free Lite plan does not include customization.  
* Create a new credential if necessary and copy your [credential for the IBM Cloud](https://console.bluemix.net/docs/services/watson/getting-started-credentials.html), to be used in the next step. Note that if you use IAM service credentials, set USERNAME to "apikey" and set PASSWORD to the value of your IAM API key.  If you use pre-IAM service credentials, set the values to your USERNAME and PASSWORD.

### 2. Set up your code

Clone the code pattern. In a terminal, run:

```
$ git clone https://github.com/IBM/Train-Custom-Speech-Model
```

The GUI is a *nodejs* web service running locally with a GUI implemented in *react*.  You will need python 2.7 and npm.

To allow the web service to connect to Watson with your account, create in the root directory a file named *services.json* by copying the sample file *services.sample.json*.  Update the apikey in the file with your api key from your credential in the previous step.

The web service will require a local login. The local user accounts are defined in the file *model/user.json*.  The pre-defined user/password are *user1/user1* and *user2/user2*.  You can modify the users as needed.

Install and start the web service by running the following commands in the root directory: 

```
cd client
npm install
cd ..
npm install
npm run dev
```

The local nodeJS web server will automatically open on your browser the site http://localhost:3000.  Log in with *user1/user1* or your own user/password.

If you want to use the command line, put the credential in your environment variable with values as noted in the previous step:

```
export USERNAME=<your-user-name>
export PASSWORD=<your-password>
```


### 3. Prepare the data

Go to the [ezDI webpage](https://www.ezdi.com/open-datasets/) and download the medical dictation dataset into the data directory and unzip the files into the Documents and Audio directory.  The data includes the audio and the verbatim transcription done by human.

The transcription files are in the rtf format.  We need to convert them to plain text format. Use a simple bash for loop to iterate through all the rtf files.

```
pip install pyth 
for name in `ls Documents/*.rtf`; 
do
  python convert_rtf.py $name
done
```

Data needs careful preparation since your deep learning model will only be as good as the data used in the training.  Preparation may include steps such as removing erroneous words in the text, bad audio recording, etc.  These step are typically very time-consuming with large dataset.   
Although the dataset from ezDI is already curated, a quick scan of the text transcription will reveal some filler text that would not help the training.  You can take a look to see these words.  

These unwanted text have been collected in the file *data/fixup.sed* to be used with the utility *sed*.  We will remove these words by:
The text and audio files are individual files.  For the purpose of training, we need to combine these files into single package.  
For the text, we can simply concatenate all the text file into one file, which is called the corpus.

```
sed -f fixup.sed Documents/*.txt > corpus-1.input
```

For the audio, we can archive them as zip or tar files.  Since the Watson API has a limit of 100MB per archive file, we will need to split up the audio files into 3 zip files.  We also set aside the first 5 audio files for testing.

```
zip audio-set1.zip -xi Audio/[6-9].wav Audio/[1-7][0-9].wav
zip audio-set2.zip -xi Audio/[8-9][0-9].wav Audio/1[0-6][0-9].wav
zip audio-set3.zip -xi Audio/1[7-9][0-9].wav Audio/2[0-4][0-9].wav
```


### 4. Train the language model
You can use two methods:  command line or web interface.  Both are described below and can be mixed as desired.  The command line instructions are assumed to be executed from the data directory. 

#### a. Command line
Since the audio files are sampled at the 8Khz rate, we will need to use the narrow band model and this is coded in the python command line.
Note that the GUI will use the name "custom-model-1" for the language model, so we will use the same name in the command line.  Create your custom language model and your corpus of medical dictation:

```
python ../cmd/create_language_model.py "custom-model-1"

```

Note the id of your custom model and set the environment variable *LANGUAGE_ID*.  You can also obtain the id by listing the language model:
```
python ../cmd/list_language_model.py
export LANGUAGE_ID=<id_for_your_model>
```

The custom model will stay in the *pending* state until a corpus of text is added.  Add the medical transcription file from the step above.  
```
python ../cmd/add_corpus.py corpus-1.input
python ../cmd/list_corpus.py
```

This step will also save the new list of Out-Of-Vocabulary words in a file.  It is useful to check the words to see if there is any unexpected words that you don't want to train the model with.  The status of the custom language model should now be *ready*.
Now we can train the language model using the medical transcription.
```
python ../cmd/train_language_model.py
```

Training is asynchronous and may take some time depending on the system workload.
You can check for completion with list_language_model.py.  When training is complete, the status will change from *training* to *available*.


#### b. GUI


### 5. Train the acoustic model

#### a. Command line

Create the custom acoustic model based on the custom language model.  Make sure that the environment variable LANGUAGE_ID is set as described in the step above.  Note that the GUI will use the name "Acoustic model 1", so we will use the same name below.

```
python ../cmd/create_acoustic_model.py "Acoustic model 1"
```

The custom acoustic model will be in the *pending* state until some audio data is added.  Add the 3 zip files containing the audio clips with the following command.  Note that it may take some time to process each audio file.  If processing is not completed yet, the command will return a *409* error message;  in this case, simply retry later.  

```
python ../cmd/add_audio.py audio-set1.zip
python ../cmd/add_audio.py audio-set2.zip
python ../cmd/add_audio.py audio-set3.zip
python ../cmd/list_audio.py
```

The status of the custom acoustic model should now be *ready*.  You can start the training by:

```
python ../cmd/train_acoustic_model.py
```

Training the acoustic model is asynchronous and typically would run overnight.  To determine when training is completed, you can query the model and check that the status has changed from *traning* to *available*.

```
python ../cmd/list_acoustic_model.py
```


#### c. GUI



### 6. Transcribe your dictation

#### a. Command line

Record your medical dictation in wav format using 8KHz sampling rate.  Transcribe by the command:

```
python ../cmd/transcribe.py <my_dictation.wav>
```
   

#### c. GUI

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