import { zipCodes } from '@/constants/zipCodes'
import { citiesMunicipalities } from '@/constants/phil-city-mun'
import { provinces } from '@/constants/phil-prov'

export function getZipCodeByCityCode(cityCode: string) {
  const zipCodeEntry = zipCodes.find((entry) => entry.cityCode === cityCode)
  return zipCodeEntry ? zipCodeEntry.zipCode : null
}

export function getCityByProvCode(provCode: string) {
  const cities = citiesMunicipalities.filter(
    (city) => city.provCode === provCode
  )
  return cities
}

export function getProvinceNameByProvCode(provCode: string) {
  const province = provinces.find((entry) => entry.code === provCode)
  return province ? province.province : null
}

export function getCityNameByCityCode(cityCode: string) {
  const city = citiesMunicipalities.find((city) => city.cityCode === cityCode)
  return city ? city.city : null
}
