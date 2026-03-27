import { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';

type StatusOptions = {
  busy?: keyof typeof StatusIndicator.busyStyles;
  progress?: keyof typeof StatusIndicator.progressStyles;
};

export class StatusIndicator {
  public statusKey: string;
  public busyStyle: keyof typeof StatusIndicator.busyStyles;
  private busyFrames: string[];
  private progressStyle: keyof typeof StatusIndicator.progressStyles = 'bars';
  // eslint-disable-next-line no-unused-vars
  private progressFrames: (_percent: number) => string;

  constructor(
    statusKey: string,
    options: StatusOptions = {
      busy: 'dots',
      progress: 'bars',
    }
  ) {
    this.statusKey = statusKey;
    this.busyStyle = options.busy || 'dots';
    this.busyFrames = StatusIndicator.busyStyles[this.busyStyle];
    this.progressStyle = options.progress || 'bars';
    this.progressFrames = StatusIndicator.progressStyles[this.progressStyle];
  }

  busy(ctx: ExtensionCommandContext, message: string): () => void {
    if (typeof ctx.ui.setStatus !== 'function') {
      return () => {};
    }

    let i = 0;
    ctx.ui.setStatus(this.statusKey, `${this.busyFrames[i]} ${message}`);

    const timer: ReturnType<typeof globalThis.setInterval> = globalThis.setInterval(() => {
      i = (i + 1) % this.busyFrames.length;
      ctx.ui.setStatus?.(this.statusKey, `${this.busyFrames[i]} ${message}`);
    }, 100);

    return () => {
      globalThis.clearInterval(timer);
      ctx.ui.setStatus?.(this.statusKey, undefined);
    };
  }

  cautious(ctx: ExtensionCommandContext, message: string) {
    ctx.ui.setStatus?.(this.statusKey, `⚠️ ${message}`);
  }

  critical(ctx: ExtensionCommandContext, message: string) {
    ctx.ui.setStatus?.(this.statusKey, `❌ ${message}`);
  }

  positive(ctx: ExtensionCommandContext, message: string) {
    ctx.ui.setStatus?.(this.statusKey, `✅ ${message}`);
  }

  informative(ctx: ExtensionCommandContext, message: string) {
    ctx.ui.setStatus?.(this.statusKey, `ℹ️ ${message}`);
  }

  progress(ctx: ExtensionCommandContext, message: string, percent: number) {
    const progressBar = this.progressFrames(percent);
    ctx.ui.setStatus?.(this.statusKey, `${progressBar} ${message}`);
  }

  static busyStyles = {
    dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  };

  static progressStyles = {
    bars: (percent: number) => {
      const clampedPercent = Math.max(0, Math.min(100, percent));
      const progressBarLength = 20;
      const filledLength = Math.round((clampedPercent / 100) * progressBarLength);
      const emptyLength = progressBarLength - filledLength;
      return '█'.repeat(filledLength) + '░'.repeat(emptyLength);
    },

    pie: (percent: number) => {
      const clampedPercent = Math.max(0, Math.min(100, percent));
      const pieFrames = ['○', '◔', '◑', '◕', '●'];
      const frameIndex = Math.floor((clampedPercent / 100) * (pieFrames.length - 1));
      return pieFrames[frameIndex];
    },
  };
}
