import { useEffect } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@getrentos/ui-native';
import { gateOfflineQueue, replayGateQueue, type GateReplaySummary } from '@/lib/gateOfflineQueue';
import { qk } from '@/lib/query/keys';

/**
 * Drains the gate's offline queue.
 *
 * Mounted inside the gate console rather than at the app root: a guard is the
 * only person who records these writes, and the gate console is where they will
 * be looking when the network returns. Rendering nothing is the point — the
 * queue's state is shown in the Check-In screen where the guard acts, not as a
 * banner strapped across every screen in the app.
 *
 * Replay is attempted on three signals, because on a phone no single one is
 * reliable: connectivity returning, the app coming back to the foreground (a
 * phone carried into signal never fires a connectivity change), and the console
 * mounting.
 */
export function GateQueueSync() {
  const toast = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    // Load what survived the restart before anything tries to send it.
    void gateOfflineQueue.hydrate();

    let cancelled = false;

    const report = (summary: GateReplaySummary | null) => {
      if (cancelled || !summary) return;

      // Refresh the estate's own view of who is inside as soon as writes land.
      if (summary.sent > 0) void qc.invalidateQueries({ queryKey: qk.gateman.all });

      if (summary.unconfirmed.length > 0) {
        // Deliberately not phrased as success or failure: the API can't tell us
        // which, and a guard acting on a guess is worse than one who checks.
        toast.show(
          `Couldn't confirm ${summary.unconfirmed.length} saved entr${
            summary.unconfirmed.length === 1 ? 'y' : 'ies'
          }. Check the pass.`,
          'warning'
        );
      }
      if (summary.rejected.length > 0) {
        toast.show(
          `${summary.rejected.length} saved entr${
            summary.rejected.length === 1 ? 'y was' : 'ies were'
          } refused by the estate.`,
          'error'
        );
      }
    };

    const tryReplay = () => {
      void replayGateQueue().then(report, () => undefined);
    };

    tryReplay();

    const unsubscribeNet = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) tryReplay();
    });

    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') tryReplay();
    });

    return () => {
      cancelled = true;
      unsubscribeNet();
      appState.remove();
    };
  }, [qc, toast]);

  return null;
}
