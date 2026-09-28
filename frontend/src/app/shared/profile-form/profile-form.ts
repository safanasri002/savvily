import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

type FieldName = 'profession' | 'maritalstatus' | 'kids' | 'birthday' | 'salary';

export interface ProfileFormValue {
  profession: string;
  maritalstatus: string;
  kids: number | null;
  birthday: string;
  salary: number | null;
}

const MIN_AGE = 16;

const ERROR_MESSAGES: Record<FieldName, Record<string, string>> = {
  profession: { required: 'Profession is required.' },
  maritalstatus: { required: 'marital status is required.' },
  kids: { required: 'Number of kids is required.', min: 'Number of kids cannot be negative.' },
  birthday: {
    required: 'Date of birth is required.',
    date: 'Enter a valid date.',
    minAge: `You must be at least ${MIN_AGE}.`,
  },
  salary: { required: 'Salary is required.', min: 'Salary cannot be negative.' },
};

function minAge(years: number) {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    if (!control.value) return null;
    const birth = new Date(control.value);
    if (Number.isNaN(birth.getTime())) return { date: true };
    const limit = new Date();
    limit.setFullYear(limit.getFullYear() - years);
    return birth > limit ? { minAge: true } : null;
  };
}

/** Financial profile fields (profession, birthday, salary), shared by onboarding and the profile page. */
@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-form.html',
  styleUrl: './profile-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileForm implements OnInit {
  readonly submitLabel = input('Save');
  readonly pending = input(false);
  readonly initial = input<Partial<ProfileFormValue> | null>(null);
  readonly save = output<ProfileFormValue>();

  protected readonly attempted = signal(false);
  protected readonly maxBirthDate = new Date().toISOString().slice(0, 10);

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    profession: ['', Validators.required],
    maritalstatus: ['', Validators.required],
    kids: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    birthday: ['', [Validators.required, minAge(MIN_AGE)]],
    salary: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  ngOnInit(): void {
    const initial = this.initial();
    if (initial) {
      this.form.setValue({
        profession: initial.profession ?? '',
        maritalstatus: initial.maritalstatus ?? '',
        kids: initial.kids ?? null,
        birthday: initial.birthday ?? '',
        salary: initial.salary ?? null,
      });
    }
  }


  protected hasError(name: FieldName): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.attempted());
  }

  protected errorFor(name: FieldName): string {
    const errors = this.form.controls[name].errors;
    if (!errors) return '';
    return ERROR_MESSAGES[name][Object.keys(errors)[0]] ?? 'Invalid value.';
  }

  protected submit(): void {
    this.attempted.set(true);
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }
    const { profession, maritalstatus, kids, birthday, salary } = this.form.getRawValue();
    // `salary` is an int8 column: store whole units.
    this.save.emit({
      profession: profession.trim(),
      maritalstatus: maritalstatus.trim(),
      kids: Math.round(kids ?? 0),
      birthday,
      salary: Math.round(salary ?? 0),
    });
    this.form.markAsPristine();
  }
}
