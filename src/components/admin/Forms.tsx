'use client';

import { useActionState } from 'react';
import { saveProduct, saveRecipe, type FormState } from '@/app/admin/actions';
import { METHOD_LABELS } from '@/lib/format';

function Field({ label, name, defaultValue, type = 'text', required }: {
  label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="input" defaultValue={defaultValue ?? ''} required={required} />
    </div>
  );
}

function Status({ state, pending }: { state: FormState; pending: boolean }) {
  if (pending) return <p className="text-sm text-muted">Сохраняем…</p>;
  if (state?.error) return <p className="text-sm text-danger">{state.error}</p>;
  if (state?.saved) return <p className="text-sm text-muted">Сохранено ✓</p>;
  return null;
}

export interface ProductValues {
  id?: number; slug?: string; name?: string; description?: string; origin?: string; process?: string;
  variety?: string; roastLevel?: string; flavorNotes?: string[]; imageUrl?: string | null;
  sortOrder?: number; isPublished?: boolean;
}

export function ProductForm({ p }: { p: ProductValues }) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={p.id ?? ''} />
      <Field label="Название" name="name" defaultValue={p.name} required />
      <Field label="Адрес в ссылке (латиница, напр. ethiopia-yirgacheffe)" name="slug" defaultValue={p.slug} required />
      <div>
        <label className="label" htmlFor="description">Описание</label>
        <textarea id="description" name="description" className="input min-h-28" defaultValue={p.description} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Происхождение" name="origin" defaultValue={p.origin} />
        <Field label="Обработка" name="process" defaultValue={p.process} />
        <Field label="Разновидность" name="variety" defaultValue={p.variety} />
        <Field label="Обжарка" name="roastLevel" defaultValue={p.roastLevel} />
      </div>
      <Field label="Вкусовые ноты через запятую" name="flavorNotes" defaultValue={p.flavorNotes?.join(', ')} />
      <Field label="Ссылка на фото (https://…)" name="imageUrl" defaultValue={p.imageUrl} />
      <div className="grid grid-cols-2 items-end gap-3">
        <Field label="Порядок в каталоге" name="sortOrder" type="number" defaultValue={p.sortOrder ?? 0} />
        <label className="flex items-center gap-2 pb-3">
          <input type="checkbox" name="isPublished" defaultChecked={p.isPublished ?? true} /> Показывать
        </label>
      </div>
      <button className="btn w-full" disabled={pending}>Сохранить</button>
      <Status state={state} pending={pending} />
    </form>
  );
}

export interface RecipeValues {
  id?: number; productId: number; method?: string; title?: string; doseG?: number; waterG?: number;
  tempC?: number; grind?: string; note?: string; sortOrder?: number; isPublished?: boolean; stepsText?: string;
}

export function RecipeForm({ r }: { r: RecipeValues }) {
  const [state, action, pending] = useActionState(saveRecipe, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={r.id ?? ''} />
      <input type="hidden" name="productId" value={r.productId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="method">Способ</label>
          <select id="method" name="method" className="input" defaultValue={r.method ?? 'v60'}>
            {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <Field label="Название (необязательно)" name="title" defaultValue={r.title} />
        <Field label="Кофе, г" name="doseG" type="number" defaultValue={r.doseG ?? 15} required />
        <Field label="Вода, г" name="waterG" type="number" defaultValue={r.waterG ?? 250} required />
        <Field label="Температура, °C" name="tempC" type="number" defaultValue={r.tempC ?? 93} required />
        <Field label="Порядок" name="sortOrder" type="number" defaultValue={r.sortOrder ?? 0} />
      </div>
      <Field label="Помол" name="grind" defaultValue={r.grind} />
      <Field label="Примечание" name="note" defaultValue={r.note} />
      <div>
        <label className="label" htmlFor="steps">Этапы — по строке: действие | секунд | вода к концу, г | название | подсказка</label>
        <textarea id="steps" name="steps" className="input min-h-48 font-mono text-sm" defaultValue={r.stepsText}
          placeholder={'налить | 15 | 40 | Блуминг | Смочите весь кофе\nждать | 30 | | Ждём\nналить | 30 | 250 | Основной пролив'} />
        <p className="mt-1 text-xs text-muted">Действия: налить, ждать, помешать, прессовать. Для «налить» вода обязательна — сколько всего будет к концу этапа.</p>
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isPublished" defaultChecked={r.isPublished ?? true} /> Показывать
      </label>
      <button className="btn w-full" disabled={pending}>Сохранить</button>
      <Status state={state} pending={pending} />
    </form>
  );
}
