import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MARITAL_STATUSES, MaritalStatus, UserProfile } from '../../core/user';

type FieldName = 'profession' | 'maritalStatus' | 'kids' | 'birthday' | 'salary';

const MIN_AGE = 16;

const ERROR_MESSAGES: Record<FieldName, Record<string, string>> = {
  profession: { required: 'Profession is required.' },
  maritalStatus: { required: 'Marital status is required.' },
  kids: {
    required: 'Number of children is required.',
    min: 'Cannot be negative.',
    pattern: 'Enter a whole number.',
  },
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

/** Financial profile fields (profession, family, birthday, salary), shared by onboarding and the profile page. */
@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-form.html',
  styleUrl: './profile-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileForm implements OnInit {
  readonly initial = input<UserProfile | null>(null);
  readonly submitLabel = input('Save');
  readonly pending = input(false);
  readonly save = output<UserProfile>();

  protected readonly attempted = signal(false);
  protected readonly maritalStatuses = MARITAL_STATUSES;
  protected readonly maxBirthDate = new Date().toISOString().slice(0, 10);

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    profession: ['', Validators.required],
    maritalStatus: this.fb.control<MaritalStatus | ''>('', Validators.required),
    kids: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.pattern(/^\d+$/),
    ]),
    birthday: ['', [Validators.required, minAge(MIN_AGE)]],
    salary: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
  });
  ngOnInit(): void {
    const initial = this.initial();
    if (initial) {
      this.form.setValue({
        profession: initial.profession ?? '',
        maritalStatus: initial.maritalStatus ?? '',
        kids: initial.kids,
        birthday: initial.birthday ?? '',
        salary: initial.salary,
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
    const { profession, maritalStatus, kids, birthday, salary } = this.form.getRawValue();
    this.save.emit({
      profession: profession.trim(),
      maritalStatus: maritalStatus || null,
      kids: kids ?? 0,
      birthday,
      salary: Math.round(salary ?? 0),
    });
    this.form.markAsPristine();
  }
}
