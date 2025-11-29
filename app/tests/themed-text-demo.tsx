// app/tests/themed-text-demo.tsx

import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

// Define the helper component to encapsulate the repetitive structure
// This component automatically applies the styles.example and styles.exampleRow
function DemoExample({ children, ...rest }: PropsWithChildren<ViewProps>) {
  return (
    <ThemedView style={styles.example}>
      <View style={[styles.exampleRow, rest.style]} {...rest}>
        {children}
      </View>
    </ThemedView>
  );
}

export default function ThemedTextDemoScreen() {
  return (
    <ScreenContainer>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.sectionTitle}>
          ThemedText Component Demo
        </ThemedText>
        <ThemedText style={styles.description} colorVariant="textSubtle">
          This page demonstrates all the different prop combinations for the ThemedText component.
        </ThemedText>

        {/* Type Variants */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>
            Type Variants
          </ThemedText>
          
          <DemoExample>
            <ThemedText type="xlarge">xlarge - Extra Large Text</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="xlarge"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="title">title - Title Text</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="title"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="subtitle">subtitle - Subtitle Text</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="subtitle"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="large">large - Large Text</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="large"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="default">default - Default Text</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="default"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="defaultSemiBold">defaultSemiBold - Semi Bold Text</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="defaultSemiBold"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="small">small - Small Text</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="small"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="xsmall">xsmall - Extra Small Text</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="xsmall"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="caption">caption - Caption Text</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="caption"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="link">link - Link Text</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="link"
            </ThemedText>
          </DemoExample>
        </ThemedView>

        {/* Color Variants */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>
            Color Variants
          </ThemedText>
          
          <DemoExample>
            <ThemedText colorVariant="text">text - Default Text Color</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              colorVariant="text"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText colorVariant="textAlt">textAlt - Alternative Text Color</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              colorVariant="textAlt"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText colorVariant="textSubtle">textSubtle - Subtle Text Color</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              colorVariant="textSubtle"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText colorVariant="tint">tint - Tint Color</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              colorVariant="tint"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText colorVariant="link">link - Link Color</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              colorVariant="link"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText colorVariant="success">success - Success Color</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              colorVariant="success"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText colorVariant="warning">warning - Warning Color</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              colorVariant="warning"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText colorVariant="error">error - Error Color</ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              colorVariant="error"
            </ThemedText>
          </DemoExample>
        </ThemedView>

        {/* Custom Colors */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>
            Custom Colors
          </ThemedText>
          
          <DemoExample>
            <ThemedText lightColor="#FF6B6B" darkColor="#4ECDC4">
              Custom Light/Dark Colors
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              lightColor="#FF6B6B" darkColor="#4ECDC4"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText lightColor="#9B59B6">
              Custom Light Color Only
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              lightColor="#9B59B6"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText darkColor="#F39C12">
              Custom Dark Color Only
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              darkColor="#F39C12"
            </ThemedText>
          </DemoExample>
        </ThemedView>

        {/* Extra Font Scaling (NEW SECTION) */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>
            Extra Font Scaling (fontScaleExtra)
          </ThemedText>
          
          <DemoExample>
            <ThemedText type="default" fontScaleExtra={1.5}>
              Scaled by 1.5x (Normal Font Size)
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              fontScaleExtra={'{1.5}'}
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="title" fontScaleExtra={0.75} colorVariant="tint">
              Scaled by 0.75x (Shrunk Title)
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="title" fontScaleExtra={'{0.75}'}
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="large" fontScaleExtra={2.0} colorVariant="error">
              Scaled by 2.0x (Large Text)
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="large" fontScaleExtra={'{2.0}'}
            </ThemedText>
          </DemoExample>
        </ThemedView>
        
        {/* Type + Color Combinations */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>
            Type + Color Combinations
          </ThemedText>
          
          <DemoExample>
            <ThemedText type="title" colorVariant="textAlt">
              title + textAlt
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="title" colorVariant="textAlt"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="subtitle" colorVariant="success">
              subtitle + success
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="subtitle" colorVariant="success"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="defaultSemiBold" colorVariant="error">
              defaultSemiBold + error
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="defaultSemiBold" colorVariant="error"
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText type="link" colorVariant="textAlt">
              link type (forces link color)
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="link" colorVariant="textAlt" (forces link color)
            </ThemedText>
          </DemoExample>
        </ThemedView>

        {/* Custom Styles */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>
            Custom Styles
          </ThemedText>
          
          <DemoExample>
            <ThemedText style={{ marginTop: 10, marginBottom: 10 }}>
              With marginTop and marginBottom
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              {'style={{ marginTop: 10, marginBottom: 10 }}'}
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText style={{ textAlign: 'center', fontWeight: 'bold' }}>
              Centered and Bold
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              {'style={{ textAlign: \'center\', fontWeight: \'bold\' }}'}
            </ThemedText>
          </DemoExample>
          
          <DemoExample>
            <ThemedText 
              type="title" 
              style={{ 
                textDecorationLine: 'underline',
                letterSpacing: 2 
              }}
            >
              Underlined with Letter Spacing
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              {'type="title" style={{ textDecorationLine: \'underline\', letterSpacing: 2 }}'}
            </ThemedText>
          </DemoExample>
        </ThemedView>

        {/* Complex Examples (Note: This section contains non-standard examples which are not refactored by DemoExample) */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>
            Complex Examples
          </ThemedText>
          
          <ThemedView style={styles.example}>
            <ThemedText>
              This is a paragraph with{' '}
              <ThemedText type="defaultSemiBold" colorVariant="textAlt">
                inline bold text
              </ThemedText>
              {' '}and a{' '}
              <ThemedText type="link">link</ThemedText>
              {' '}in the middle.
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              Nested: default + defaultSemiBold colorVariant="textAlt" + link
            </ThemedText>
          </ThemedView>
          
          {/* Using DemoExample inside complex section for structured row examples */}
          <DemoExample style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <ThemedText type="title" colorVariant="success" style={{ marginBottom: 8 }}>
              Success Title
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="title" colorVariant="success"
            </ThemedText>
            <ThemedText colorVariant="textSubtle">
              This is a subtitle with subtle color
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              colorVariant="textSubtle"
            </ThemedText>
          </DemoExample>

          <DemoExample>
            <ThemedText type="caption" colorVariant="error">
              Error caption text
            </ThemedText>
            <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
              type="caption" colorVariant="error"
            </ThemedText>
          </DemoExample>
        </ThemedView>
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  example: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  propLabel: {
    flexShrink: 1,
    textAlign: 'right',
    minWidth: 100,
  },
});