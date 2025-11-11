interface ReservationStepperProps {
  currentStep: 1 | 2 | 3;
}

export default function ReservationStepper({ currentStep }: ReservationStepperProps) {
  const steps = [
    { id: 1, label: 'Datum wählen' },
    { id: 2, label: 'Tisch auswählen' },
    { id: 3, label: 'Reservierung abschließen' },
  ];

  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4">
      {steps.map((s, idx) => {
        const isActive = s.id === currentStep;
        const isDone = s.id < currentStep;
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
              isActive ? 'bg-primary-600 text-white' : isDone ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-700'
            }`}>
              {s.id}
            </div>
            <div className={`ml-3 text-sm font-medium ${isActive ? 'text-neutral-900' : 'text-neutral-600'}`}>{s.label}</div>
            {idx < steps.length - 1 && (
              <div className="mx-4 h-px flex-1 bg-neutral-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}