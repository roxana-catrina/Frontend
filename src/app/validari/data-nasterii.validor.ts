import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function DataNastereInvalida(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const currentDate = new Date();
    const enteredDate = new Date(control.value);

    if (enteredDate > currentDate) {
      return { 'futureDate': true }; // Dacă data de naștere este în viitor
    }
    return null; // Dacă data este validă
  };
}