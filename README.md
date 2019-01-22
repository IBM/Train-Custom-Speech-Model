

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
3. The user uses the provided web front-end to run training using the batch of data.
4. The user interactively tests the new custom Speech model by speaking phrases to the computer microphone and verify the text transcription returned from the model.
5. If the text transcription is not correct, the user can make correction and resubmit the updated data for training.
6. Several users can work on the same custom model at the same time.


## Included components

* [IBM Watson Speech](https://www.ibm.com/watson/services/speech-to-text): easily convert audio and voice into written text for quick understanding of content.
* Web front-end application to run the training.
* A real dataset with 16 hours of medical dictation, provided by [ezDI](https://www.ezdi.com).


## Featured technologies
* Speech recognition by AI: advanced models for processing audio signals and language context can accurately transcribe spoken voice into text.

# Watch the Video

[![](http://img.youtube.com/XXXXXX.jpg)](https://www.youtube.com/watch?v=XXXXXX)

# Steps

Download the code and run locally on your computer.


1. [Clone the repo](#1-clone-the-repo)
2.
3.
4.
5.
5.

### 1. Clone the repo

Clone the `...` locally. In a terminal, run:

```
$ git clone https://github.com/IBM/Train-Custom-Speech-Model
```

We’ll be using

### 2. Create Watson services with IBM Cloud

Create the following services:

* asdf


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