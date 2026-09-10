import React, { useState, useRef } from "react";
import { Pressable, Text, StyleSheet, Animated } from "react-native";

// Press-and-hold to start recording, release to stop+send.
// onStart / onStop are async callbacks supplied by the screen.
export default function PTTButton({ onStart, onStop, disabled }) {
  const [active, setActive] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = async () => {
    if (disabled) return;
    setActive(true);
    Animated.spring(scale, { toValue: 1.08, useNativeDriver: true }).start();
    await onStart();
  };

  const handlePressOut = async () => {
    if (!active) return;
    setActive(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    await onStop();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.btn, active && styles.btnActive, disabled && styles.btnDisabled]}
      >
        <Text style={[styles.label, active && styles.labelActive]}>
          {active ? "RELEASE\nTO SEND" : "HOLD\nTO TALK"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: "#1c1c1c",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  btnActive: {
    backgroundColor: "#2e6e5e",
    borderColor: "#2e6e5e",
  },
  btnDisabled: {
    opacity: 0.4,
  },
  label: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
    color: "#1c1c1c",
  },
  labelActive: {
    color: "#fff",
  },
});
