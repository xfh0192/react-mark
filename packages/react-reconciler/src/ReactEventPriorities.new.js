/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Lane, Lanes} from './ReactFiberLane.new';

import {
  NoLane,
  SyncLane,
  InputContinuousLane,
  DefaultLane,
  IdleLane,
  getHighestPriorityLane,
  includesNonIdleWork,
} from './ReactFiberLane.new';

export opaque type EventPriority = Lane;

export const DiscreteEventPriority: EventPriority = SyncLane;               // 0b0000000000000000000000000000001
export const ContinuousEventPriority: EventPriority = InputContinuousLane;  // 0b0000000000000000000000000000100
export const DefaultEventPriority: EventPriority = DefaultLane;             // 0b0000000000000000000000000010000
export const IdleEventPriority: EventPriority = IdleLane;                   // 0b0100000000000000000000000000000

let currentUpdatePriority: EventPriority = NoLane;

export function getCurrentUpdatePriority(): EventPriority {
  return currentUpdatePriority;
}

export function setCurrentUpdatePriority(newPriority: EventPriority) {
  currentUpdatePriority = newPriority;
}

// 以指定优先级执行fn，随后还原优先级
export function runWithPriority<T>(priority: EventPriority, fn: () => T): T {
  const previousPriority = currentUpdatePriority;
  try {
    currentUpdatePriority = priority;
    return fn();
  } finally {
    currentUpdatePriority = previousPriority;
  }
}

// 获取a，b中更高的优先级的一方
export function higherEventPriority(
  a: EventPriority,
  b: EventPriority,
): EventPriority {
  return a !== 0 && a < b ? a : b;
}

// 检查a优先级是否比b高
export function isHigherEventPriority(
  a: EventPriority,
  b: EventPriority,
): boolean {
  return a !== 0 && a < b;
}

export function lanesToEventPriority(lanes: Lanes): EventPriority {
  // 获取lanes中最高的优先级
  const lane = getHighestPriorityLane(lanes);
  // lane优先级比DiscreteEventPriority高时，使用DiscreteEventPriority
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority;
  }
  // lane优先级比ContinuousEventPriority高时，使用ContinuousEventPriority
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority;
  }
  // 非IdleLanes时
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority;
  }
  return IdleEventPriority;
}
