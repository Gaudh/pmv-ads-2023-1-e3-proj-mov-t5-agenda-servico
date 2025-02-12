import React from 'react';
import { View, StyleSheet, Image, Text, Pressable } from 'react-native';
import { WhiteColor } from '../constants/colors';


export interface ProfileImageProps {
    onPress?: () => void
    image?: string
}

export function ProfileImage({onPress, image }: ProfileImageProps) {
    
    return (
        <View style={style.body}>
            <Image 
                style={style.profileImage}
                source={{
                    uri: image,
                  }}
            />
            <Pressable
                onPress={onPress}
            > 
                <Text style={style.btnProfile}> Mudar Foto </Text>
            </Pressable>
        </View>
    )

}

const style = StyleSheet.create({
    body: {
         alignSelf:'center',
         paddingBottom: 90,

    },
    profileImage: {
        width: 120,
        height: 120,
        alignSelf:'center',
        borderRadius: 60,

    },
    btnProfile: {
        paddingTop: 15,
        color: WhiteColor,
        alignSelf:'center',
        textDecorationLine:'underline', 
        fontSize: 16,
    },
})