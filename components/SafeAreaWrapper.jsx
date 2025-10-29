import theme from '@/theme';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SafeAreaWrapper = ({ 
  children, 
  backgroundColor = theme.colors.background.primary,
  style = {},
  edges = ['top', 'left', 'right', 'bottom'],
  containerStyle = {},
  ...props 
}) => {
  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor,
        },
        containerStyle
      ]} 
      {...props}
    >
      <SafeAreaView 
        style={[
          styles.safeArea,
          style
        ]}
        edges={edges}
      >
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
});

export default SafeAreaWrapper;