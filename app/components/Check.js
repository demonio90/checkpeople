import React, { useState } from 'react';
import { ImageBackground, TextInput, Text, StyleSheet, View, Animated, Easing } from 'react-native';
import { Icon, Button, Spinner } from 'native-base';
import Tts from 'react-native-tts';

import firestore from '@react-native-firebase/firestore';

const Check = () => {

    const [identification, setIdentification] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [fadeIn, setFadeIn] = useState(new Animated.Value(0));

    const checkUser = async () => {
        try {
            setIsLoading(true);
            const data = await firestore().collection('users').where('identification', '==', identification).get();
            if (data.size > 0) {
                let user = data.docs[0].data();
                user.id = data.docs[0].id;
                updatedUser(user);
            } else {
                console.log('El usuario no está registrado');
                setIsLoading(false);
                setIdentification(null);
            }
        } catch (e) {
            console.log('Problema al verificar el usuario, intentelo nuevamente');
            setIsLoading(false);
            setIdentification(null);
        }
    }

    const updatedUser = async user => {
        const payload = { inout: !user.inout }
        try {
            await firestore().collection('users').doc(user.id).set(payload, { merge: true });
            talk(user);
        } catch (e) {
            console.log('Error al actualizar el usuario, intentelo nuevamente');
        }
    }

    const talk = user => {
        setIsLoading(false);
        setIdentification(null);
        if (user.inout) {
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

    return (
        <ImageBackground source={require('../../assets/img/bg.png')} style={styles.backgroundImg} imageStyle={styles.resize} >
            <Animated.View style={{
                alignItems: 'center',
                opacity: fadeIn
            }}>
                <Text style={styles.textUser}>{message}</Text>
            </Animated.View>

            <View style={styles.containerForm}>
                <TextInput placeholder='Identificación' keyboardType='numeric' onChange={e => setIdentification(e.nativeEvent.text)} style={styles.input} value={identification} />

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
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
    backgroundImg: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    resize: {
        resizeMode: 'cover'
    },
    containerForm: {
        height: 350, 
        justifyContent: 'center'
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
