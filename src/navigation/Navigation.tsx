import React, { FC } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import { navigationRef } from '../utils/NavigationUtil';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import SendScreen from '../screens/SendScreen';
import RecieveScreen from '../screens/RecieveScreen';

import ConnectionScreen from '../screens/ConnectionScreen';
import RecievedFileScreen from '../screens/RecievedFileScreen';
import { TCPProvider } from '../service/TCPProvider';



const Stack = createNativeStackNavigator();
const Navigation: FC = () => {
  return (
    <TCPProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName='SplashScreen'
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name='SplashScreen' component={SplashScreen} />
          <Stack.Screen name='HomeScreen' component={HomeScreen} />
          <Stack.Screen name='SendScreen' component={SendScreen} />
          <Stack.Screen name='RecieveScreen' component={RecieveScreen} />
          <Stack.Screen name='ConnectionScreen' component={ConnectionScreen} />
          <Stack.Screen name='RecievedFileScreen' component={RecievedFileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </TCPProvider>
  )
}

export default Navigation