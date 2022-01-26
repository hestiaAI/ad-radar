import * as React from 'react';
import {browser} from 'webextension-polyfill-ts';
import {JsObject} from '../Core/types';
import {validateAccessors} from '../Core/accessors';

import './styles.scss';

document.addEventListener('DOMContentLoaded', () => {
  browser.storage.local.get().then((store) => {
    (document.getElementById('accessors') as HTMLTextAreaElement).value =
      JSON.stringify(store.accessors, null, 2);
  });
});

function showError(id: string, error: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = error;
  }
}

function validateAndSave(): void {
  const accessorsText = (
    document.getElementById('accessors') as HTMLTextAreaElement
  ).value;
  const successDiv = document.getElementById('save-success');
  showError('accessors-error', '');
  successDiv!.style.display = 'none';

  let accessors: JsObject;
  try {
    accessors = JSON.parse(accessorsText);
  } catch (error) {
    showError('accessors-error', `Malformed accessors: ${error.message}`);
    return;
  }

  const schemaErrors = validateAccessors(accessors);
  if (schemaErrors) {
    showError('accessors-error', `Malformed accessors: ${schemaErrors[0]}`);
    return;
  }

  browser.storage.local.set({accessors});
  successDiv!.style.display = '';
}

const Options: React.FC = () => {
  return (
    <div>
      <label htmlFor="accessors">Accessors:</label>
      <div>
        <textarea id="accessors" name="accessors" rows={30} cols={50} />
      </div>
      <div id="accessors-error" className="error" style={{display: 'none'}} />
      <div id="save-success" className="success">
        Saved settings successfully!
      </div>
      <button type="button" id="save" onClick={validateAndSave}>
        Save settings
      </button>
    </div>
  );
};

export default Options;
