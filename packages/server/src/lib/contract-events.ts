type ContractEventListener = (event: string, data: unknown) => void;

const listenersByTemplate = new Map<string, Set<ContractEventListener>>();

export const subscribeToContractEvents = (
  templateId: string,
  listener: ContractEventListener,
) => {
  const listeners = listenersByTemplate.get(templateId) ?? new Set<ContractEventListener>();
  listeners.add(listener);
  listenersByTemplate.set(templateId, listeners);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      listenersByTemplate.delete(templateId);
    }
  };
};

export const publishContractEvent = (
  templateId: string,
  event: string,
  data: unknown,
) => {
  listenersByTemplate.get(templateId)?.forEach((listener) => listener(event, data));
};
