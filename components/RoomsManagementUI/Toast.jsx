import theme from "@/theme";
import { AlertCircle, CheckCircle, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";

export const Toast = ({ visible, message, type = "success", onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 15,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  const toastConfig = {
    success: {
      backgroundColor: theme.colors.status.success,
      icon: CheckCircle,
      iconColor: "#FFFFFF",
    },
    error: {
      backgroundColor: theme.colors.status.error,
      icon: AlertCircle,
      iconColor: "#FFFFFF",
    },
    warning: {
      backgroundColor: theme.colors.status.warning,
      icon: AlertCircle,
      iconColor: "#FFFFFF",
    },
    info: {
      backgroundColor: theme.colors.primary.blue,
      icon: AlertCircle,
      iconColor: "#FFFFFF",
    },
  };

  const config = toastConfig[type] || toastConfig.success;
  const ToastIcon = config.icon;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: config.backgroundColor,
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <ToastIcon size={20} color={config.iconColor} />
      <Text style={styles.toastMessage}>{message}</Text>
      <TouchableOpacity onPress={hideToast} style={styles.toastClose}>
        <X size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 50,
    left: theme.spacing.base,
    right: theme.spacing.base,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.borderRadius.card,
    ...theme.shadows.lg,
    zIndex: 9999,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: "#FFFFFF",
    marginLeft: theme.spacing.sm,
  },
  toastClose: {
    padding: theme.spacing.xs,
  },
});
