/**
 * A small playground inside the repo, similar to Storybook. Each "story"
 * is a component registered here. The playground then shows the selected
 * one on its own.
 *
 * We do not look for stories at build time. Instead, we list them here by
 * hand, so the type system can check everything is fine.
 */
import type { FunctionComponent } from '../libs/Reactisma/core/types';
import HeatmapStory from './stories/heatmap.story';
import ButtonStory from './stories/button.story';

export interface Story {
  id: string;
  title: string;
  Component: FunctionComponent;
}

export const stories: Story[] = [
  { id: 'heatmap', title: 'ActivationHeatmap', Component: HeatmapStory },
  { id: 'button', title: 'Button states', Component: ButtonStory },
];
