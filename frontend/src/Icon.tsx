import { PrimeIcons as _ } from "primereact/api"

export function Icon(params: { slug: 'plus' | 'shopping-cart', spin?: boolean }) {
	return ['pi', `pi-${params.slug}`, params.spin && 'pi-spin'].join(' ')
}