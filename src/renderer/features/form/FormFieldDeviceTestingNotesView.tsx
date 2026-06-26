import {
  FIELD_DEVICE_TESTING_NOTES_INTRO,
  FIELD_DEVICE_TESTING_NOTES_ITEMS,
} from '../../../shared/form/fieldDeviceTestingNotes';

export function FormFieldDeviceTestingNotesView() {
  return (
    <div className="fdtn-panel">
      <p className="fdtn-intro">{FIELD_DEVICE_TESTING_NOTES_INTRO}</p>
      <ol className="fdtn-list">
        {FIELD_DEVICE_TESTING_NOTES_ITEMS.map((text, index) => (
          <li key={index} className="fdtn-item">
            {text}
          </li>
        ))}
      </ol>
    </div>
  );
}
