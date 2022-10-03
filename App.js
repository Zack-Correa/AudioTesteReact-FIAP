import { StatusBar } from "expo-status-bar";
import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import {Buffer} from "buffer";

export default function App() {
  const [recording, setRecording] = React.useState();
  const [recordings, setRecordings] = React.useState([]);
  const [message, setMessage] = React.useState("");

  function test() {
    const formData = new FormData();
    formData.append("file", {
      uri: recordings[0].file,
      name: "test.wav",
      type: "audio/wav",
    });
    axios
      .post(url='/*ENDPOINT AQUI*/', data=formData, {
        responseType: 'arraybuffer',
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then( async function (response) {
        const bufferData = Buffer.from(response.data);
        let fileData = await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'response.wav', bufferData.toString('base64'), {
          encoding: 'base64',
        });
        const { sound } = await Audio.Sound.createAsync({uri:FileSystem.documentDirectory + 'response.wav'});
    
        console.log('Playing Sound');
        await sound.playAsync();
      })
      .catch(function (error) {
        console.log(error);
        console.error(error.response);
      });
    console.log(formData);
  }

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recording = new Audio.Recording();
        try {
          await recording.prepareToRecordAsync({
            android: {
              extension: ".wav",
              outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_WEBM,
              audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_VORBIS,
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 128000,
            },
            ios: {
              extension: ".wav",
              audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 128000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
          });
          await recording.startAsync();
          // You are now recording!
        } catch (error) {
          // An error occurred!
        }

        setRecording(recording);
      } else {
        setMessage("Please grant permission to app to access microphone");
      }
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();

    let updatedRecordings = [...recordings];
    const { sound, status } = await recording.createNewLoadedSoundAsync();
    updatedRecordings.push({
      sound: sound,
      duration: getDurationFormatted(status.durationMillis),
      file: recording.getURI(),
    });

    console.log(updatedRecordings);

    setRecordings(updatedRecordings);
  }

  function getDurationFormatted(millis) {
    const minutes = millis / 1000 / 60;
    const minutesDisplay = Math.floor(minutes);
    const seconds = Math.round((minutes - minutesDisplay) * 60);
    const secondsDisplay = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutesDisplay}:${secondsDisplay}`;
  }

  function playSound(file){
    console.log(file.sound);
  }

  function getRecordingLines() {
    return recordings.map((recordingLine, index) => {
      console.log(typeof recordings[0].file);
      return (
        <View key={index} style={styles.row}>
          <Text style={styles.fill}>
            Recording {index + 1} - {recordingLine.duration}
          </Text>
          <Button
            style={styles.button}
            onPress={() => playSound(recordingLine)}
            title="Play"
          ></Button>
          <Button
            style={styles.button}
            onPress={() => Sharing.shareAsync(recordingLine.file)}
            title="Share"
          ></Button>
          <Button
            style={styles.button}
            onPress={() => test()}
            title="Teste"
          ></Button>
        </View>
      );
    });
  }

  return (
    <View style={styles.container}>
      <Text>{message}</Text>
      <Button
        title={recording ? "Stop Recording" : "Start Recording"}
        onPress={recording ? stopRecording : startRecording}
      />
      {getRecordingLines()}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fill: {
    flex: 1,
    margin: 16,
  },
  button: {
    margin: 16,
  },
});
