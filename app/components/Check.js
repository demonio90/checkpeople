import React, { useState, useRef, useEffect } from 'react';
import { ImageBackground, TextInput, Text, StyleSheet, View, Animated, StatusBar } from 'react-native';
import { Icon, Button, Spinner, Toast } from 'native-base';
import { Snackbar } from 'react-native-paper';
import Tts from 'react-native-tts';
import { RNCamera } from 'react-native-camera';
import uuid from 'random-uuid-v4';
import { validateId } from '../utils/Validations';
import KeepAwake from 'react-native-keep-awake';

import firebase from 'react-native-firebase';

const Check = () => {

    const [identification, setIdentification] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [fadeIn, setFadeIn] = useState(new Animated.Value(0));
    const [visible, setVisible] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        let isSubscribed = true;
        isSubscribed && KeepAwake.activate();
        return () => isSubscribed = false;
    }, []);

    const changedInput = e => {
        setErrors({error: false, message: 'El campo Identificación no puede estar vacío', input: false});
        setIdentification(e.nativeEvent.text);
    }

    const checkUser = async () => {
        if(!identification) {
            setErrors({error: true, message: 'El campo Identificación no puede estar vacío', input: true});
            setVisible(true);
        }else {
            if(!validateId(identification)) {
                setErrors({error: true, message: 'La identificación no es correcta', input: true});
                setVisible(true);
            }else {
                try {
                    setIsLoading(true);
                    const data = await firebase.firestore().collection('users').where('identification', '==', identification).get();
                    if (data.size > 0) {
                        let user = data.docs[0].data();
                        user.id = data.docs[0].id;
                        updatedUser(user);
                    } else {
                        setVisible(true);
                        setErrors({error: true, message: 'El usuario no está registrado'});
                        setIsLoading(false);
                        setIdentification(null);
                    }
                }catch (e) {
                    setVisible(true);
                    setErrors({error: true, message: 'Error al verificar el usuario, intentelo nuevamente'});
                    setIsLoading(false);
                    setIdentification(null);
                }
            }
        }
    }

    const updatedUser = async user => {
        const payload = { inout: !user.inout }
        try {
            await firebase.firestore().collection('users').doc(user.id).set(payload, { merge: true });
            talk(user);
        } catch (e) {
            setVisible(true);
            setErrors({error: true, message: 'Error al actualizar el usuario, intentelo nuevamente'});
        }
    }

    const talk = user => {
        setIsLoading(false);
        setIdentification(null);
        takePicture(user);
        if (!user.inout) {
            AnimatedText();
            setMessage(`Hola ${user.name}`);
            Tts.speak(`Hola ${user.name}`);
        } else {
            AnimatedText();
            setMessage(`Hasta pronto ${user.name}`);
            Tts.speak(`Hasta pronto ${user.name}`);
        }
    }

    const AnimatedText = () => {
        Animated.sequence([
            Animated.timing(fadeIn, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true
            }),
            Animated.delay(1000),
            Animated.timing(fadeIn, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true
            })
        ]).start();
    }

    const takePicture = async user => {
        if (camera) {
            camera.resumePreview();
            const options = { quality: .1, base64: true };
            const data = await camera.takePictureAsync(options);
            uploadImage(data.uri, user);
        }
    }

    const uploadImage = async (uriImage, user) => {
        const photoName = uuid();
        const ref = firebase.storage().ref(`photos/${user.name}`).child(photoName);

        try {
            const image = await ref.putFile(uriImage);
        } catch (error) {
            setVisible(true);
            setErrors({error: true, message: 'Ocurrió un problema interno, intentelo nuevamente'});
        }
    }
    
    return (
        <ImageBackground source={require('../../assets/img/bg.png')} style={styles.backgroundImg} imageStyle={styles.resize}>
            <StatusBar hidden={SVGComponentTransferFunctionElement}/>
            <RNCamera
                ref={(ref) => { camera = ref }}
                type={RNCamera.Constants.Type.front}
                flashMode={RNCamera.Constants.FlashMode.off}
                androidCameraPermissionOptions={{
                    title: 'Permiso para usar la camara',
                    message: 'Se requieren permisos para utilizar la camara',
                    buttonPositive: 'Ok',
                    buttonNegative: 'Cancel',
                }}
            />
            <Animated.View style={{
                alignItems: 'center',
                opacity: fadeIn
            }}>
                <Text style={styles.textUser}>{message}</Text>
            </Animated.View>

            <View style={styles.containerForm}>
                <TextInput placeholder='Identificación' keyboardType='numeric' onChange={e => changedInput(e)} style={errors.input ? styles.inputError : styles.input} value={identification} />

                <Button disabled={isLoading} block iconLeft rounded success onPress={checkUser} style={styles.button}>
                    {isLoading ? (
                        <>
                            <Spinner color='white' />
                            <Text style={styles.textBtn}>Validando...</Text>
                        </>
                    ) : (
                            <>
                                <Icon ios='ios-finger-print' android="md-finger-print" style={styles.icon} />
                                <Text style={styles.textBtn}>Verificar</Text>
                            </>
                        )}
                </Button>
            </View>
            <Snackbar
                visible={visible}
                onDismiss={() => setVisible(false)}
                style={{backgroundColor: '#ef5350'}}
            >
                { errors.message }
            </Snackbar>
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
    backgroundImg: {
        flex: 1,
        justifyContent: 'center',
        //paddingHorizontal: 20,
        alignItems: 'center'
    },
    resize: {
        resizeMode: 'cover'
    },
    containerForm: {
        width: '100%',
        height: 350,
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    input: {
        backgroundColor: '#FFFFFF',
        fontSize: 17,
        marginBottom: 20,
        borderRadius: 50,
        paddingHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.58,
        shadowRadius: 16.00,
        elevation: 24
    },
    inputError: {
        backgroundColor: '#FFFFFF',
        fontSize: 17,
        marginBottom: 20,
        borderRadius: 50,
        paddingHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.58,
        shadowRadius: 16.00,
        elevation: 24,
        borderColor: '#ef5350',
        borderWidth: 2
    },
    icon: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 30
    },
    textUser: {
        fontWeight: 'bold',
        fontSize: 18, color: '#FFFFFF',
        textTransform: 'uppercase',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.58,
        shadowRadius: 16.00,
        elevation: 24,
    },
    textBtn: {
        fontWeight: 'bold',
        fontSize: 14, color: '#FFFFFF',
        marginLeft: 5,
        textTransform: 'uppercase'
    },
    button: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.58,
        shadowRadius: 16.00,
        elevation: 24
    }
});

export default Check;
