import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

function shimColors(c: Palette) {
  return {
    bg: c.bg, card: c.bgCard, cardAlt: c.bgElevated, border: c.border,
    primary: c.primary, gold: c.gold, textPrimary: c.textPrimary,
    textSecondary: c.textSecondary, textMuted: c.textMuted,
    green: c.scoreGood, purple: c.darkCircles, pink: '#F472B6',
  };
}
type ShimColors = ReturnType<typeof shimColors>;

interface Exercise {
  id: string;
  name: string;
  duration: number;
  reps?: number;
  description: string;
  howTo: string[];
  targetArea: string;
  benefit: string;
  emoji: string;
}

function buildRoutines(Colors: ShimColors) {
  return [
  {
    id: 'morning',
    name: 'Morning Lift',
    duration: '8 min',
    color: Colors.gold,
    icon: '🌅',
    description: 'Energize and tone facial muscles. Best done after morning skincare, before SPF.',
    exercises: [
      {
        id: 'lion',
        name: 'Lion Pose',
        duration: 15,
        reps: 5,
        description: 'Full-face tension release and muscle activation.',
        howTo: [
          'Inhale deeply through nose',
          'Open mouth wide, stick tongue out and down toward chin',
          'Open eyes wide, look up',
          'Exhale forcefully through mouth with a "ha" sound',
          'Hold for 3 seconds at full extension',
          'Relax. Repeat 5 times.',
        ],
        targetArea: 'Full face, jaw, neck',
        benefit: 'Releases jaw tension, activates 50+ facial muscles simultaneously, reduces stress holding patterns',
        emoji: '🦁',
      },
      {
        id: 'cheek_lift',
        name: 'Cheek Sculptor',
        duration: 30,
        description: 'Targets the zygomaticus major — the muscle responsible for lifted cheeks.',
        howTo: [
          'Smile wide while keeping your lips closed (teeth together)',
          'Place index fingers on the corners of your mouth',
          'Gently push upward and outward with your fingers while resisting with your lip muscles',
          'Hold for 10 seconds, feeling the resistance in your cheeks',
          'Relax. Repeat 6 times.',
        ],
        targetArea: 'Cheekbones, nasolabial fold area',
        benefit: 'Lifts cheeks, reduces nasolabial fold depth over time with consistent practice',
        emoji: '✨',
      },
      {
        id: 'forehead',
        name: 'Forehead Smoother',
        duration: 30,
        description: 'Counteracts habitual frowning and raises brow tension.',
        howTo: [
          'Place all fingers just above your eyebrows',
          'Apply gentle downward pressure with your fingers',
          'Try to raise your eyebrows upward against the resistance',
          'Hold for 5 seconds',
          'Relax and repeat 8 times',
          'Then do the reverse: pull brows slightly up, then try to lower them against the resistance',
        ],
        targetArea: 'Forehead, frontalis muscle',
        benefit: 'Reduces horizontal forehead lines, trains the frontalis muscle to rest without tension',
        emoji: '🧘',
      },
      {
        id: 'neck',
        name: 'Swan Neck',
        duration: 30,
        description: 'Targets platysma and neck muscles for jawline definition.',
        howTo: [
          'Tilt head back slightly',
          'Purse lips forward as if kissing the ceiling',
          'Hold for 5 seconds',
          'Bring head back to center and relax',
          'Repeat 10 times',
          'Then tilt head to each side (left ear to left shoulder) and hold 10 seconds each side',
        ],
        targetArea: 'Neck, jawline, platysma',
        benefit: 'Defines jawline, reduces neck sagging, improves posture which affects facial appearance',
        emoji: '🦢',
      },
    ] as Exercise[],
  },
  {
    id: 'tension',
    name: 'Tension Release',
    duration: '6 min',
    color: Colors.purple,
    icon: '😌',
    description: 'Stress and tension accumulate in the face. Release chronic holding patterns.',
    exercises: [
      {
        id: 'jaw_release',
        name: 'Jaw Melt',
        duration: 45,
        description: 'The jaw is where most people hold chronic tension. This releases it completely.',
        howTo: [
          'Open mouth slightly (2 finger widths)',
          'Let jaw hang loose — completely passive',
          'With fingers, gently massage masseter muscles (cheekbone to jaw corner)',
          'Move jaw side to side slowly 5 times',
          'Open as wide as comfortable and hold 10 seconds',
          'Close slowly. Repeat the cycle 3 times.',
        ],
        targetArea: 'Jaw, temporomandibular joint, masseter',
        benefit: 'Releases jaw clenching, reduces tension headaches, softens jowl area',
        emoji: '😮',
      },
      {
        id: 'eye_tension',
        name: 'Eye Orbit Reset',
        duration: 30,
        description: 'Releases orbicularis oculi tension accumulated from squinting.',
        howTo: [
          'Close eyes gently',
          'Without moving your eyelids, roll your eyes in a slow clockwise circle — 5 times',
          'Reverse direction — 5 times counterclockwise',
          'Open eyes wide for 5 seconds',
          'Squeeze shut for 5 seconds',
          'Open and relax completely. Repeat twice.',
        ],
        targetArea: 'Around eyes, crow\'s feet area',
        benefit: 'Reduces squint lines, eye fatigue, dark circles from tension',
        emoji: '👁️',
      },
      {
        id: 'brow',
        name: 'Brow Furrow Reset',
        duration: 30,
        description: 'Habitual frowning creates grooves. Reset the muscle memory.',
        howTo: [
          'Place the middle and index fingers of both hands between your brows',
          'With fingers, gently smooth outward toward temples',
          'Simultaneously try to furrow brows — resist with your fingers',
          'Hold resistance for 5 seconds',
          'Relax fingers and let brows soften completely',
          'Repeat 8 times',
        ],
        targetArea: 'Glabella, corrugator muscles',
        benefit: 'Reduces 11 lines (glabella furrows), trains brow muscles to rest without tension',
        emoji: '😠',
      },
      {
        id: 'scalp',
        name: 'Scalp Release',
        duration: 45,
        description: 'The scalp connects to the face via fascia. A tight scalp means a tense face.',
        howTo: [
          'Place all fingers on scalp, spread wide',
          'Move scalp (not fingers) in circles — skin should slide over skull',
          'Work from forehead hairline to crown and back down',
          'Pinch and release along the hairline',
          'End by placing both palms over temples and pressing gently inward',
          'Hold 10 seconds, breathing deeply',
        ],
        targetArea: 'Scalp, galea aponeurotica, temporal fascia',
        benefit: 'Releases overall facial tension, improves circulation to face, reduces headaches',
        emoji: '🧠',
      },
    ] as Exercise[],
  },
  {
    id: 'glow',
    name: 'Glow Boost',
    duration: '5 min',
    color: Colors.pink,
    icon: '🌸',
    description: 'Stimulate circulation for immediate natural glow. Great before events.',
    exercises: [
      {
        id: 'circulation',
        name: 'Tap & Glow',
        duration: 60,
        description: 'Percussive tapping stimulates blood flow to the surface immediately.',
        howTo: [
          'Using all fingertips, begin gentle rapid tapping on forehead',
          'Work down to temples, then cheeks, nose, chin',
          'Tap neck upward toward jaw',
          'Gradually increase pressure to comfortable intensity',
          'Continue 60 seconds maintaining rhythm',
          'Finish with palming — press warm palms gently to cheeks for 10 seconds',
        ],
        targetArea: 'Full face, neck',
        benefit: 'Immediate circulation boost, natural flush and glow, lymphatic stimulation',
        emoji: '✋',
      },
      {
        id: 'fish',
        name: 'Fish Face',
        duration: 30,
        description: 'Targets the buccinator and cheek hollowing muscles.',
        howTo: [
          'Suck cheeks in to create "fish face"',
          'Hold for 5 seconds',
          'While holding, try to smile',
          'Hold smile + fish face for 5 seconds',
          'Release and puff cheeks out (hold air)',
          'Move air side to side 5 times. Repeat cycle 5 times.',
        ],
        targetArea: 'Cheeks, buccinator muscle',
        benefit: 'Sculpts cheek hollows, defines cheekbones, improves circulation to cheeks',
        emoji: '🐟',
      },
      {
        id: 'pout',
        name: 'Lip & Philtrum Lift',
        duration: 30,
        description: 'Works orbicularis oris for lip definition.',
        howTo: [
          'Purse lips into a tight O shape',
          'Push lips forward as far as possible',
          'Hold 5 seconds',
          'Now smile wide — lips still closed, teeth together',
          'Hold 5 seconds',
          'Alternate O and smile 10 times total. Finally: blow air through pursed lips 5 times.',
        ],
        targetArea: 'Lips, philtrum, perioral area',
        benefit: 'Defines lip border, reduces marionette lines, lifts philtrum area',
        emoji: '💋',
      },
    ] as Exercise[],
  },
  ];
}

export default function FacialYogaScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const ROUTINES = useMemo(() => buildRoutines(Colors), [Colors]);
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [selectedRoutine, setSelectedRoutine] = useState(ROUTINES[0]);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [detailEx, setDetailEx] = useState<Exercise | null>(null);

  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const currentEx = selectedRoutine.exercises[currentExIdx];

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startSession = () => {
    setCurrentExIdx(0);
    setTimeLeft(selectedRoutine.exercises[0].duration);
    setSessionActive(true);
    setSessionComplete(false);
    startPulse();
  };

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!sessionActive) {
      if (interval.current) clearInterval(interval.current);
      return;
    }
    interval.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCurrentExIdx(idx => {
            if (idx + 1 >= selectedRoutine.exercises.length) {
              setSessionActive(false);
              setSessionComplete(true);
              stopPulse();
              clearInterval(interval.current!);
              return idx;
            }
            setTimeLeft(selectedRoutine.exercises[idx + 1].duration);
            return idx + 1;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (interval.current) clearInterval(interval.current); };
  }, [sessionActive, selectedRoutine]);

  if (detailEx) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setDetailEx(null)} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{detailEx.name}</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.detailEmoji}>{detailEx.emoji}</Text>
          <Text style={styles.detailName}>{detailEx.name}</Text>
          <Text style={styles.detailTarget}>Target: {detailEx.targetArea}</Text>
          <Text style={styles.detailDesc}>{detailEx.description}</Text>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitLabel}>Benefit</Text>
            <Text style={styles.benefitText}>{detailEx.benefit}</Text>
          </View>
          <Text style={styles.howToTitle}>How To</Text>
          {detailEx.howTo.map((step, i) => (
            <View key={i} style={styles.howToStep}>
              <Text style={styles.howToNum}>{i + 1}</Text>
              <Text style={styles.howToText}>{step}</Text>
            </View>
          ))}
          <Text style={styles.duration}>{detailEx.duration}s per set {detailEx.reps ? `• ${detailEx.reps} reps` : ''}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Facial Yoga</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      {sessionActive || sessionComplete ? (
        <ScrollView contentContainerStyle={styles.sessionContent}>
          {sessionComplete ? (
            <View style={styles.completeBlock}>
              <Text style={styles.completeEmoji}>🌸</Text>
              <Text style={styles.completeTitle}>Session Complete!</Text>
              <Text style={styles.completeSub}>
                Your facial muscles have been worked and will strengthen over time with consistency. Apply tallow now for maximum post-yoga skin absorption.
              </Text>
              <TouchableOpacity style={styles.doneBtn} onPress={() => setSessionComplete(false)}>
                <Text style={styles.doneBtnText}>Back to Routines</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sessionRoutine}>{selectedRoutine.icon} {selectedRoutine.name}</Text>
              <Text style={styles.sessionProgress}>Exercise {currentExIdx + 1} of {selectedRoutine.exercises.length}</Text>
              <Animated.View style={[styles.exerciseCircle, { transform: [{ scale: pulseAnim }], borderColor: selectedRoutine.color }]}>
                <Text style={styles.exerciseEmoji}>{currentEx.emoji}</Text>
                <Text style={styles.exerciseTimer}>{timeLeft}s</Text>
              </Animated.View>
              <Text style={[styles.exerciseName, { color: selectedRoutine.color }]}>{currentEx.name}</Text>
              <Text style={styles.exerciseTarget}>{currentEx.targetArea}</Text>
              <View style={styles.howToLive}>
                {currentEx.howTo.map((step, i) => (
                  <Text key={i} style={styles.howToLiveStep}>{i + 1}. {step}</Text>
                ))}
              </View>
              <View style={styles.progressDots}>
                {selectedRoutine.exercises.map((_, i) => (
                  <View key={i} style={[styles.dot, i === currentExIdx && { backgroundColor: selectedRoutine.color }, i < currentExIdx && { backgroundColor: Colors.green }]} />
                ))}
              </View>
              <TouchableOpacity onPress={() => { setSessionActive(false); stopPulse(); }}>
                <Text style={styles.stopBtn}>End Session</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      ) : (
        <Animated.ScrollView style={[styles.scroll, { opacity: contentAnim }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>
            Facial yoga uses targeted muscle exercises to tone, lift, and relax the face. Like body fitness — results come with consistency over weeks and months.
          </Text>

          {ROUTINES.map(routine => (
            <TouchableOpacity
              key={routine.id}
              style={[styles.routineCard, selectedRoutine.id === routine.id && { borderColor: routine.color }]}
              onPress={() => setSelectedRoutine(routine)}
              activeOpacity={0.8}
            >
              <View style={styles.routineHeader}>
                <Text style={styles.routineIcon}>{routine.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.routineName, { color: selectedRoutine.id === routine.id ? routine.color : Colors.textPrimary }]}>{routine.name}</Text>
                  <Text style={styles.routineMeta}>{routine.duration} · {routine.exercises.length} exercises</Text>
                </View>
                {selectedRoutine.id === routine.id && (
                  <Text style={[styles.selectedBadge, { borderColor: routine.color, color: routine.color }]}>SELECTED</Text>
                )}
              </View>
              <Text style={styles.routineDesc}>{routine.description}</Text>
              {selectedRoutine.id === routine.id && (
                <View style={styles.exerciseList}>
                  {routine.exercises.map((ex, i) => (
                    <TouchableOpacity key={i} style={styles.exRow} onPress={() => setDetailEx(ex)}>
                      <Text style={styles.exEmoji}>{ex.emoji}</Text>
                      <Text style={styles.exName}>{ex.name}</Text>
                      <Text style={styles.exDuration}>{ex.duration}s</Text>
                      <Text style={styles.exArrow}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: selectedRoutine.color }]}
            onPress={startSession}
          >
            <Text style={styles.startBtnText}>{selectedRoutine.icon} Start {selectedRoutine.name}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ShimColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: c.primary, fontSize: 16 },
  headerTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  intro: {
    color: c.textSecondary, fontSize: 13, lineHeight: 20,
    backgroundColor: c.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: c.border, marginBottom: 16,
  },
  routineCard: {
    backgroundColor: c.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: c.border, marginBottom: 12,
  },
  routineHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  routineIcon: { fontSize: 24 },
  routineName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  routineMeta: { color: c.textMuted, fontSize: 12 },
  selectedBadge: {
    fontSize: 9, fontWeight: '700', borderWidth: 1,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  routineDesc: { color: c.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 10 },
  exerciseList: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10 },
  exRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8,
  },
  exEmoji: { fontSize: 16 },
  exName: { flex: 1, color: c.textSecondary, fontSize: 13 },
  exDuration: { color: c.textMuted, fontSize: 12 },
  exArrow: { color: c.textMuted, fontSize: 16 },
  startBtn: {
    borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Session
  sessionContent: { padding: 16, alignItems: 'center' },
  sessionRoutine: { color: c.textSecondary, fontSize: 14, marginBottom: 4 },
  sessionProgress: { color: c.textMuted, fontSize: 12, marginBottom: 20 },
  exerciseCircle: {
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 4, backgroundColor: c.card,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  exerciseEmoji: { fontSize: 48, marginBottom: 4 },
  exerciseTimer: { color: c.textPrimary, fontSize: 28, fontWeight: '900' },
  exerciseName: { fontSize: 20, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  exerciseTarget: { color: c.textMuted, fontSize: 12, marginBottom: 16 },
  howToLive: { alignSelf: 'stretch', gap: 6, marginBottom: 16 },
  howToLiveStep: { color: c.textSecondary, fontSize: 13, lineHeight: 20, paddingHorizontal: 8 },
  progressDots: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.border },
  stopBtn: { color: c.textMuted, fontSize: 14, paddingVertical: 10 },
  completeBlock: { alignItems: 'center', paddingTop: 60 },
  completeEmoji: { fontSize: 60, marginBottom: 16 },
  completeTitle: { color: c.textPrimary, fontSize: 24, fontWeight: '900', marginBottom: 10 },
  completeSub: {
    color: c.textSecondary, fontSize: 14, lineHeight: 22,
    textAlign: 'center', paddingHorizontal: 20, marginBottom: 30,
  },
  doneBtn: {
    backgroundColor: c.primary, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Detail
  detailEmoji: { fontSize: 52, textAlign: 'center', marginBottom: 10 },
  detailName: { color: c.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  detailTarget: { color: c.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 10 },
  detailDesc: { color: c.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 14 },
  benefitCard: {
    backgroundColor: c.primary + '15', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: c.primary + '44', marginBottom: 14,
  },
  benefitLabel: { color: c.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  benefitText: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  howToTitle: { color: c.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  howToStep: {
    flexDirection: 'row', gap: 10, marginBottom: 8,
  },
  howToNum: {
    color: c.primary, fontSize: 13, fontWeight: '700',
    width: 18, paddingTop: 1,
  },
  howToText: { flex: 1, color: c.textSecondary, fontSize: 13, lineHeight: 21 },
  duration: {
    color: c.textMuted, fontSize: 13, textAlign: 'center',
    marginTop: 16, paddingBottom: 40,
  },
  });
}
