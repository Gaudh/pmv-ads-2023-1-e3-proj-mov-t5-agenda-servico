import React, { useReducer } from 'react';

import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppParamsList } from '../routes/ParamList';
import { UserRepository } from '../repositories/user_repository';
import { User } from '../models/user';
import { useErrorContext, ErrorState } from '../contexts/error_context';
import { KEY_USERDATA, USER_CLIENT } from '../constants/app';
import { useAppContext } from '../contexts/app_context';
import { LoginAction, LoginInitialState, LoginReducer, LoginState } from '../reducers/login_reducer';
import { hash } from '../utils/crypto';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { InputIconText, InputText } from '../components/Inputs';
import { IcEyeOffSvg, IcEyeSvg } from '../constants/icons';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {
  BackgroundColor,
  BlackColor,
  PrimaryColor,
  TextInputHintColor,
  WhiteColor,
} from '../constants/colors';

import {
  FacebookButton,
  GoogleButton,
  PrimaryButton,
} from '../components/Buttons';

import {
  Settings,
  AccessToken,
  LoginManager,
  Profile,
} from 'react-native-fbsdk-next';

import CheckBox from '@react-native-community/checkbox';
import EncryptedStorage from 'react-native-encrypted-storage';

/***
 * login
 */

const login = async (
  navigation: NativeStackNavigationProp<AppParamsList, "Login", undefined>,
  errorContext: ErrorState,
  state: LoginState,
  dispatch: React.Dispatch<LoginAction>
) => {
  dispatch({ type: 'set_is_checking_auth', payload: true });

  const userRepo = new UserRepository();
  userRepo.findUserByEmail(state.email, user => {
    if (user && user.tipo_login === 'app') {
      if (user.hash === hash(state.password)) {
        EncryptedStorage.setItem(
          KEY_USERDATA,
          JSON.stringify(user),
        ).then(() => {
          navigation.replace('Home', {});
        });
      } else {
        errorContext.dispatchError('Usuário e/ou senha invalido!');
      }
    } else {
      errorContext.dispatchError('Usuário e/ou senha invalido!');
    }
    dispatch({ type: 'set_is_checking_auth', payload: false });
  });
};

/***
 * googleLogin
 */

const googleLogin = async (
  navigation: NativeStackNavigationProp<AppParamsList, "Login", undefined>,
  errorContext: ErrorState
) => {
  GoogleSignin.configure({
    scopes: ['email'],
    webClientId:
      '1044670167757-f5a5b86b7f067ebr6q14vn8s14h8941f.apps.googleusercontent.com',
    forceCodeForRefreshToken: true,
  });

  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const userRepo = new UserRepository();

    userRepo.findUserByEmail(userInfo.user.email, user => {
      if (user && user.tipo_login === 'google') {
        EncryptedStorage.setItem(
          KEY_USERDATA,
          JSON.stringify(user),
        ).then(() => {
          navigation.replace('Home', {});
        });
      } else {
        const newUser = new User();
        newUser.email = userInfo.user.email;
        newUser.nome = userInfo.user.name ?? userInfo.user.email;
        newUser.imagem_perfil = userInfo.user.photo ?? '';
        newUser.tipo = USER_CLIENT;
        newUser.tipo_login = 'google';
        userRepo.create(newUser, _ => {
          EncryptedStorage.setItem(
            KEY_USERDATA,
            JSON.stringify(newUser),
          ).then(() => {
            navigation.replace('Home', {});
          });
        });
      }
    });

    // TODO: O token na base de dados.
  } catch (e: any) {
    console.log(e.code);
    errorContext.dispatchError('Falha ao fazer autenticação!');
  }
};

/***
 * faceBookLogin
 */

const faceBookLogin = async (
  navigation: NativeStackNavigationProp<AppParamsList, "Login", undefined>,
  errorContext: ErrorState
) => {
  Settings.setAppID('2273447656158262');
  Settings.initializeSDK();

  try {
    const result = await LoginManager.logInWithPermissions(
      ['public_profile', 'email'],
      'limited',
      'my_nonce',
    );

    // TODO: O token na base de dados.
    if (!result.isCancelled) {
      const acessToken = await AccessToken.getCurrentAccessToken();
      if (acessToken) {
        const currentProfile = await Profile.getCurrentProfile();
        if (currentProfile) {
          const userRepo = new UserRepository();
          const newUser = new User();

          newUser.email =
            currentProfile.email ?? currentProfile.userID ?? '';
          newUser.nome = currentProfile.firstName ?? '';
          newUser.imagem_perfil = currentProfile.imageURL ?? '';
          newUser.tipo = USER_CLIENT;
          newUser.tipo_login = 'facebook';
          userRepo.create(newUser, _ => {
            EncryptedStorage.setItem(
              KEY_USERDATA,
              JSON.stringify(newUser),
            ).then(() => {
              navigation.replace('Home', {});
            });
          });
        }
      } else {
        errorContext.dispatchError('Falha ao fazer autenticação!');
      }
    } else {
      errorContext.dispatchError('Falha ao fazer autenticação!');
    }
  } catch (error) {
    console.log(error);
    errorContext.dispatchError('Falha ao fazer autenticação!');
  }
};

/***
 * LoginPage
 */

export function LoginPage({
  navigation,
}: NativeStackScreenProps<AppParamsList, 'Login'>) {
  const [state, dispatch] = useReducer(LoginReducer, LoginInitialState);

  const errorContext = useErrorContext();
  const appContext = useAppContext();

  React.useEffect(() => {
    EncryptedStorage.getItem(KEY_USERDATA).then(value => {
      if (value) {
        appContext.setUser(JSON.parse(value));
        navigation.replace('Home', {});
      } else {
        dispatch({ type: 'set_is_checking_user_data', payload: false });
      }
    });
  }, [appContext, navigation, dispatch]);

  return state.isCheckingUserData ? (
    <View style={styles.container} />
  ) : (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentInsetAdjustmentBehavior="automatic">
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Olá, Bem-vindo!</Text>
          <Text style={styles.title}>👋</Text>
        </View>

        <Text style={styles.subtitle}>Faça login!</Text>

        <InputText
          label="Email"
          placeholder="email"
          onChange={value => dispatch({ type: 'set_email', payload: value })}
        />

        <InputIconText
          label="Senha"
          placeholder="senha"
          secureTextEntry={!state.showPassword}
          icon={state.showPassword ? IcEyeOffSvg : IcEyeSvg}
          iconLocation="end"
          onClickIcon={() => dispatch({ type: 'set_show_password', payload: !state.showPassword })}
          onChange={value => dispatch({ type: 'set_password', payload: value })}
        />

        <View
          style={styles.checkBoxContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <CheckBox
              tintColors={{ true: WhiteColor }}
              value={state.remember}
              onChange={() => dispatch({ type: 'set_remember', payload: !state.remember })}
            />
            <Text style={styles.whiteText}>Relembrar</Text>
          </View>

          <TouchableWithoutFeedback onPress={() => { }}>
            <Text style={styles.touchableText}>Esqueceu a senha?</Text>
          </TouchableWithoutFeedback>
        </View>

        <PrimaryButton
          title={state.isCheckingAuth ? 'Aguarde' : 'Login'}
          disabled={state.isCheckingAuth}
          onPress={() => { login(navigation, errorContext, state, dispatch) }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', margin: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: BlackColor }} />
          <Text
            style={{
              color: TextInputHintColor,
              fontFamily: 'Manrope-Bold',
              fontSize: 16,
              marginHorizontal: 16,
            }}>
            Ou com
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: BlackColor }} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <GoogleButton
            onPress={() => { googleLogin(navigation, errorContext); }}
          />

          <FacebookButton
            onPress={() => { faceBookLogin(navigation, errorContext) }}
          />
        </View>

        <TouchableWithoutFeedback onPress={() => { }}>
          <Text style={[styles.touchableText, { textAlign: 'center' }]}>
            Entrar como empresa!
          </Text>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => { navigation.navigate('RegisterRoute', {}) }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'center', margin: 48 }}>
          <Text style={styles.whiteText}>Não tem uma conta?</Text>
          <Text style={[styles.touchableText, { marginHorizontal: 4 }]}>
            Sign Up
          </Text>
        </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
}

/***
 * styles
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BackgroundColor,
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
  },
  titleContainer: {
    marginVertical: 24,
  },
  title: {
    color: WhiteColor,
    textAlign: 'center',
    fontFamily: 'Manrope-Bold',
    fontSize: 32,
  },
  subtitle: {
    color: TextInputHintColor,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
  },
  whiteText: {
    color: WhiteColor,
    fontFamily: 'Manrope-Bold',
  },
  checkBoxContainer: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  touchableText: {
    color: PrimaryColor,
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
  },
});
