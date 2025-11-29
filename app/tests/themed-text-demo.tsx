import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet, View } from 'react-native';

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
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="xlarge">xlarge - Extra Large Text</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="xlarge"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="title">title - Title Text</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="title"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="subtitle">subtitle - Subtitle Text</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="subtitle"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="large">large - Large Text</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="large"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="default">default - Default Text</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="default"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="defaultSemiBold">defaultSemiBold - Semi Bold Text</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="defaultSemiBold"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="small">small - Small Text</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="small"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="xsmall">xsmall - Extra Small Text</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="xsmall"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="caption">caption - Caption Text</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="caption"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="link">link - Link Text</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="link"
              </ThemedText>
            </View>
          </ThemedView>
        </ThemedView>

        {/* Color Variants */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>
            Color Variants
          </ThemedText>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText colorVariant="text">text - Default Text Color</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                colorVariant="text"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText colorVariant="textAlt">textAlt - Alternative Text Color</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                colorVariant="textAlt"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText colorVariant="textSubtle">textSubtle - Subtle Text Color</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                colorVariant="textSubtle"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText colorVariant="tint">tint - Tint Color</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                colorVariant="tint"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText colorVariant="link">link - Link Color</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                colorVariant="link"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText colorVariant="success">success - Success Color</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                colorVariant="success"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText colorVariant="warning">warning - Warning Color</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                colorVariant="warning"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText colorVariant="error">error - Error Color</ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                colorVariant="error"
              </ThemedText>
            </View>
          </ThemedView>
        </ThemedView>

        {/* Type + Color Combinations */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>
            Type + Color Combinations
          </ThemedText>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="title" colorVariant="textAlt">
                title + textAlt
              </ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="title" colorVariant="textAlt"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="subtitle" colorVariant="success">
                subtitle + success
              </ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="subtitle" colorVariant="success"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="defaultSemiBold" colorVariant="error">
                defaultSemiBold + error
              </ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="defaultSemiBold" colorVariant="error"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="link" colorVariant="textAlt">
                link type (forces link color)
              </ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="link" colorVariant="textAlt" (forces link color)
              </ThemedText>
            </View>
          </ThemedView>
        </ThemedView>

        {/* Custom Colors */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>
            Custom Colors
          </ThemedText>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText lightColor="#FF6B6B" darkColor="#4ECDC4">
                Custom Light/Dark Colors
              </ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                lightColor="#FF6B6B" darkColor="#4ECDC4"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText lightColor="#9B59B6">
                Custom Light Color Only
              </ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                lightColor="#9B59B6"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText darkColor="#F39C12">
                Custom Dark Color Only
              </ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                darkColor="#F39C12"
              </ThemedText>
            </View>
          </ThemedView>
        </ThemedView>

        {/* Custom Styles */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>
            Custom Styles
          </ThemedText>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText style={{ marginTop: 10, marginBottom: 10 }}>
                With marginTop and marginBottom
              </ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                {'style={{ marginTop: 10, marginBottom: 10 }}'}
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText style={{ textAlign: 'center', fontWeight: 'bold' }}>
                Centered and Bold
              </ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                {'style={{ textAlign: \'center\', fontWeight: \'bold\' }}'}
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
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
            </View>
          </ThemedView>
        </ThemedView>

        {/* Complex Examples */}
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
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="title" colorVariant="success" style={{ marginBottom: 8 }}>
                Success Title
              </ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="title" colorVariant="success"
              </ThemedText>
            </View>
            <View style={styles.exampleRow}>
              <ThemedText colorVariant="textSubtle">
                This is a subtitle with subtle color
              </ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                colorVariant="textSubtle"
              </ThemedText>
            </View>
          </ThemedView>
          
          <ThemedView style={styles.example}>
            <View style={styles.exampleRow}>
              <ThemedText type="caption" colorVariant="error">
                Error caption text
              </ThemedText>
              <ThemedText type="caption" colorVariant="textSubtle" style={styles.propLabel}>
                type="caption" colorVariant="error"
              </ThemedText>
            </View>
          </ThemedView>
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

